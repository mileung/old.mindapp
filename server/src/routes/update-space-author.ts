import { RequestHandler } from 'express';
import { drizzleClient, inGroup } from '../db';
import { SelectPersona, authorsTable } from '../db/schema';
import env from '../utils/env';
import { and, eq, lt } from 'drizzle-orm';
import { Author, SignedAuthor } from '../types/Author';

const updateSpaceAuthor: RequestHandler = async (req, res) => {
	const { message } = req.body as {
		message: {
			from: string;
			joinIfNotInSpace?: boolean;
			getSpaceInfo?: boolean;
			signedAuthor?: SignedAuthor;
		};
	};

	// console.log('message:', message);
	const author = message.signedAuthor ? new Author(message.signedAuthor) : null;
	if (author) {
		if (!author.signature) throw new Error('Unsigned author');
		if (author.id !== message.from) {
			throw new Error('author.id !== message.from');
		}
		if (!author.validSignature) {
			throw new Error('Invalid message.signedAuthor: ' + JSON.stringify(message.signedAuthor));
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
				owner: !env.OWNER_ID ? null : await inGroup(env.OWNER_ID),
				tokenId: env.TOKEN_ID,
				downvoteAddress: env.DOWNVOTE_ADDRESS,
				contentLimit: env.CONTENT_LIMIT,
				tagLimit: env.TAG_LIMIT,
				// env.ANYONE_CAN_JOIN
				// env.ANYONE_CAN_ADD
				deletableVotes: env.DELETABLE_VOTES,
				fetchedSelf: fromExistingMember,
			}
		: undefined;

	if (author) {
		let authorRow: undefined | SelectPersona;
		const now = Date.now();
		if (now < author.writeDate) {
			throw new Error('author.writeDate out of sync');
		}
		if (!author.walletAddress) {
			throw new Error('Missing author.walletAddress');
		}
		if (fromExistingMember) {
			if (fromExistingMember.signature !== author.signature) {
				const { addDate, addedById } = fromExistingMember;
				authorRow = (
					await drizzleClient
						.update(authorsTable)
						.set({ ...author.dbColumns, addDate, addedById })
						.where(
							and(
								eq(authorsTable.id, message.from),
								lt(authorsTable.writeDate, author.writeDate),
								eq(authorsTable.walletAddress, author.walletAddress),
							),
						)
						.returning()
				)[0];
			}
		} else if (message.joinIfNotInSpace) {
			authorRow = (
				await drizzleClient
					.insert(authorsTable)
					.values({ ...author.dbColumns, addDate: now, addedById: null })
					.returning()
			)[0];
			// console.log('join result:', result);
		} else throw new Error('Access denied');

		if (space && authorRow?.[0] && message.getSpaceInfo) {
			space.fetchedSelf = new Author(authorRow[0]).clientProps;
		}
	}
	return res.send({ space });
};

export default updateSpaceAuthor;
