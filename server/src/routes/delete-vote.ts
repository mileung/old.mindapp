import { Request, RequestHandler } from 'express';
import { debouncedSnapshot } from '../utils/git';
import env from '../utils/env';
import { drizzleClient, inGroup } from '../db';
import { and, eq } from 'drizzle-orm';
import { votesTable } from '../db/schema';

const deleteVote: RequestHandler = async (req: Request, res) => {
	const { message } = req.body as { message: { from: string; thoughtId: string } };
	if (!env.DELETABLE_VOTES) throw new Error('Votes cannot be deleted in this space');
	const fromExistingMember = await inGroup(message.from);
	if (env.GLOBAL_HOST && !fromExistingMember) {
		throw new Error('Access denied');
	}
	if (fromExistingMember?.frozen) throw new Error('Frozen persona');
	const { rowsAffected } = await drizzleClient.delete(votesTable).where(
		and(
			//
			eq(votesTable.thoughtId, message.thoughtId),
			eq(votesTable.voterId, message.from),
		),
	);
	if (rowsAffected === 0) throw new Error('Vote dne');

	res.send({});
	debouncedSnapshot();
};

export default deleteVote;
