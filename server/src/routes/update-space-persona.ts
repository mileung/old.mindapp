import { RequestHandler } from 'express';
import { inGroup, verifyItem } from '../utils/security';
import { drizzleClient } from '../db';
import { personasTable } from '../db/schema';
import env from '../utils/env';
import { and, eq, gt } from 'drizzle-orm';
import Ajv from 'ajv';
import { SignedSelf, UnsignedSelf } from '../types/Personas';
import { minute } from '../utils/time';

const ajv = new Ajv({ verbose: true });

const schema = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		writeDate: { type: 'number' },
		name: { type: 'string', maxLength: 100 },
		frozen: { type: 'boolean' },
		walletAddress: { type: 'string' },
		signature: { type: 'string' },
	},
	required: ['id', 'writeDate', 'walletAddress', 'signature'],
	additionalProperties: true,
};

const updateSpacePersona: RequestHandler = async (req, res) => {
	const { message } = req.body as {
		message: {
			from: string;
			joinIfNotInSpace?: boolean;
			getSpaceInfo?: boolean;
			signedSelf?: SignedSelf;
		};
	};
	// console.log('message:', message);

	if (message.signedSelf) {
		if (!ajv.validate(schema, message.signedSelf)) {
			throw new Error('Invalid message.signedSelf: ' + JSON.stringify(message.signedSelf));
		}
		if (message.signedSelf.id !== message.from) {
			throw new Error('signedSelf.id does not match message.from');
		}
	}

	const fromExistingMember = await inGroup(message.from);
	// This assumes if env.anyoneCanJoin, anyone can at least read - even without joining.
	if (!fromExistingMember && !env.anyoneCanJoin && message.from !== env.ownerId) {
		throw new Error('Access denied');
	}
	if (fromExistingMember?.frozen) throw new Error('Frozen persona');

	const space = message.getSpaceInfo
		? {
				name: env.spaceName,
				hubAddress: env.hubAddress,
				faucetAddress: env.faucetAddress,
				owner: { id: env.ownerId, name: (await inGroup(env.ownerId))?.name },
				self:
					(fromExistingMember as SignedSelf & {
						addDate: number;
						addedBy?: {
							id: string;
							name?: string;
						};
					}) || undefined,
			}
		: undefined;

	if (message.signedSelf) {
		const { writeDate, id, name, frozen, walletAddress, signature } = message.signedSelf;

		const valid = verifyItem(
			{
				writeDate,
				id,
				name,
				frozen,
				walletAddress,
			} as UnsignedSelf,
			message.from,
			signature!,
		);
		if (!valid) {
			// console.log('message.signedSelf:', message.signedSelf);
			throw new Error('Invalid signature');
		}
		const now = Date.now();
		if (writeDate > now + minute) throw new Error('writeDate out of sync');
		if (!message.signedSelf.walletAddress)
			throw new Error('Missing message.signedSelf.walletAddress');

		if (fromExistingMember) {
			const result = await drizzleClient
				.update(personasTable)
				.set(message.signedSelf)
				.where(
					and(
						eq(personasTable.id, message.from),
						gt(personasTable.writeDate, writeDate),
						eq(personasTable.walletAddress, message.signedSelf.walletAddress),
					),
				);
			// console.log('update result:', result);
			// TODO: check that duplicate walletAddress cannot happen
		} else if (message.joinIfNotInSpace) {
			const [row] = await drizzleClient
				.insert(personasTable)
				.values({
					...message.signedSelf, //
					addDate: now,
				})
				.returning();
			// console.log('join result:', result);
			if (space && row && message.getSpaceInfo) {
				space.self = {
					id: row.id,
					name: row.name || undefined,
					frozen: row.frozen || undefined,
					walletAddress: row.walletAddress || undefined,
					writeDate: row.writeDate!,
					signature: row.signature!,
					addDate: row.addDate,
				};
			}
		} else throw new Error('Access denied');
	}
	return res.send({ space });
};

export default updateSpacePersona;
