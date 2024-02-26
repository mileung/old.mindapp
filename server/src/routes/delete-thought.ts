import { Request, RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { debouncedSnapshot } from '../utils/git';
import { deletePath } from '../utils/files';
import { removeTagIndex } from '../utils/tags';

const deleteThought: RequestHandler = (req: Request & { body: Thought }, res) => {
	let thoughtId = req.body.thoughtId as string;

	const thought = Thought.parse(thoughtId);

	const softDelete = !!thought.childrenIds?.length || thought.mentionedByIds?.length;

	thought.tagLabels.forEach((label) => removeTagIndex(label, thought.id));
	thought.mentionedIds.forEach((id) =>
		(id === thoughtId ? thought : Thought.parse(id)).removeMention(thought.id),
	);

	if (softDelete) {
		thought.content = '';
		thought.tagLabels = [];
		thought.overwrite();
	} else {
		thought.parent?.removeChild(thoughtId);
		deletePath(thought.filePath);
	}

	res.send({ softDelete });
	debouncedSnapshot();
};

export default deleteThought;
