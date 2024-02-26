import { Request, RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { debouncedSnapshot } from '../utils/git';
import { deletePath } from '../utils/files';
import { removeTagIndex } from '../utils/tags';

const deleteThought: RequestHandler = (req: Request & { body: Thought }, res) => {
	let thoughtId = req.body.thoughtId as string;

	const thought = Thought.parse(thoughtId);

	if (!thought.childrenIds?.length) {
		thought.parent?.removeChild(thoughtId);
		thought.tagLabels.forEach((label) => removeTagIndex(label, thought.id));
		deletePath(thought.filePath);
	}

	res.send({});
	debouncedSnapshot();
};

export default deleteThought;
