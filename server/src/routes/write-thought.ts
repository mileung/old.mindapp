import { Request, RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { addTagIndex, addTags, removeTagIndex } from '../utils/tags';

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

	let oldThought: Thought;
	if (overwrite) {
		oldThought = Thought.parse(`${createDate}.${authorId}.${spaceId}`);
	}

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

	if (overwrite) {
		const added = (thought.tags || []).filter((x) => !(oldThought.tags || []).includes(x));
		const removed = (oldThought!.tags || []).filter((x) => !(thought.tags || []).includes(x));
		added.forEach((label) => addTagIndex(label, thought.id));
		removed.forEach((label) => removeTagIndex(label, thought.id));
		addTags([...(thought.tags || []), ...(oldThought!.tags || [])]);
	} else {
		(thought.tags || []).forEach((label) => addTagIndex(label, thought.id));
		addTags(thought.tags || []);
	}

	res.status(200).send(thought);
};

export default writeThought;
