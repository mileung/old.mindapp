import { RequestHandler } from 'express';
import { verifyItem } from '../utils/security';
import { drizzleClient, inGroup } from '../db';
import { SelectPersona, personasTable } from '../db/schema';
import env from '../utils/env';
import { and, eq, lt } from 'drizzle-orm';
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

	if (message.signedSelf) {
		if (!ajv.validate(schema, message.signedSelf)) {
			throw new Error('Invalid message.signedSelf: ' + JSON.stringify(message.signedSelf));
		}
		if (message.signedSelf.id !== message.from) {
			throw new Error('signedSelf.id does not match message.from');
		}
	}

	const fromExistingMember = await inGroup(message.from);
	// This assumes if env.ANYONE_CAN_JOIN, anyone can at least read - even without joining.
	if (!fromExistingMember && !env.ANYONE_CAN_JOIN && message.from !== env.OWNER_ID) {
		throw new Error('Access denied');
	}
	if (fromExistingMember?.frozen) throw new Error('Frozen persona');

	const space = message.getSpaceInfo
		? {
				name: env.SPACE_NAME,
				hubAddress: env.HUB_ADDRESS,
				faucetAddress: env.FAUCET_ADDRESS,
				owner: { id: env.OWNER_ID, name: (await inGroup(env.OWNER_ID))?.name },
				fetchedSelf:
					(fromExistingMember as SignedSelf & {
						addDate: number;
						addedBy?: {
							id: string;
							name?: string;
						};
					}) || null,
			}
		: undefined;

	if (message.signedSelf) {
		const { writeDate, id, name, frozen, walletAddress, signature } = message.signedSelf;
		let row: undefined | SelectPersona;
		const valid = verifyItem(
			{
				writeDate,
				id,
				name,
				frozen,
				walletAddress,
			} as UnsignedSelf,
			message.from,
			signature,
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
			if (fromExistingMember.signature !== message.signedSelf.signature) {
				row = (
					await drizzleClient
						.update(personasTable)
						.set({
							writeDate,
							name: name || null,
							frozen: frozen || null,
							signature,
						})
						.where(
							and(
								eq(personasTable.id, message.from),
								lt(personasTable.writeDate, writeDate),
								eq(personasTable.walletAddress, message.signedSelf.walletAddress),
							),
						)
						.returning()
				)[0];
			}
		} else if (message.joinIfNotInSpace) {
			row = (
				await drizzleClient
					.insert(personasTable)
					.values({
						...message.signedSelf, //
						addDate: now,
					})
					.returning()
			)[0];
			// console.log('join result:', result);
		} else throw new Error('Access denied');
		if (space && row && message.getSpaceInfo) {
			space.fetchedSelf = {
				id: row.id,
				name: row.name || undefined,
				frozen: row.frozen || undefined,
				walletAddress: row.walletAddress || undefined,
				writeDate: row.writeDate!,
				signature: row.signature!,
				addDate: row.addDate,
			};
		}
	}
	return res.send({ space });
};

export default updateSpacePersona;
