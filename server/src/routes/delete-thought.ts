import { Request, RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { deleteFile } from '../utils/files';
import { debouncedSnapshot } from '../utils/git';
import env from '../utils/env';
import { inGroup } from '../utils/security';

const deleteThought: RequestHandler = async (req: Request & { body: Thought }, res) => {
	const { message } = req.body as { message: { from: string; thoughtId: string } };

	const fromExistingMember = await inGroup(message.from);
	if (env.IS_GLOBAL_SPACE && !env.ANYONE_CAN_JOIN && !fromExistingMember) {
		throw new Error('Access denied');
	}
	if (fromExistingMember?.frozen) throw new Error('Frozen persona');

	const thought = await Thought.query(message.thoughtId);
	if (!thought) throw new Error('Thought does not exist');
	if (env.IS_GLOBAL_SPACE && thought.authorId !== message.from)
		throw new Error('message.from not from authorId');
	const softDelete = await thought.hasUserInteraction(); // TODO: make this atomic with the overwrite
	if (softDelete) {
		thought.content = '';
		thought.tags = [];
		thought.signature = '';
		thought.overwrite();
	} else {
		!env.IS_GLOBAL_SPACE && deleteFile(thought.filePath);
		thought.removeFromDb();
	}

	res.send({ softDelete });
	debouncedSnapshot();
};

export default deleteThought;
