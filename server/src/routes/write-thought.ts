import { Request, RequestHandler } from 'express';
import { Thought } from '../types/Thought';

const writeThought: RequestHandler = (req: Request & { body: Thought }, res) => {
	const spaceId = null;
	const now = Date.now();
	const {
		thought: { authorId, content, tags },
		parentId,
	} = req.body as {
		thought: Thought;
		parentId?: string;
	};

	new Thought(spaceId, now, authorId, content, tags, parentId, [], true);

	res.send({ createDate: now });
};

export default writeThought;
