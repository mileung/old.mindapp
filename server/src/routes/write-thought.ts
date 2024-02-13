import { Request, RequestHandler } from 'express';
import { Thought } from '../types/Thought';

const writeThought: RequestHandler = (req: Request & { body: Thought }, res) => {
	let {
		parentId,
		thought: { createDate, authorId, spaceId, content, tags },
	} = req.body as {
		parentId?: string;
		thought: Thought;
	};
	const overwrite = !!createDate;
	createDate = createDate || Date.now(); // can be used for editing

	const thought = new Thought(
		{
			createDate,
			authorId,
			spaceId,
			content,
			tags,
			parentId,
		},
		true,
		overwrite,
	);

	res.status(200).send(thought);
};

export default writeThought;
