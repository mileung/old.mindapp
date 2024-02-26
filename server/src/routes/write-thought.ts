import { Request, RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { addTagIndex, addTagsByLabel, removeTagIndex } from '../utils/tags';
import { debouncedSnapshot } from '../utils/git';

const writeThought: RequestHandler = (req: Request & { body: Thought }, res) => {
	// return res.send({});
	let body = req.body as Thought;
	const editing = !!body.createDate;
	const createDate = body.createDate || Date.now(); // can be used for editing
	let thought: Thought;
	if (editing) {
		const oldThought = Thought.parse(`${createDate}.${body.authorId}.${body.spaceId}`);
		thought = Thought.parse(oldThought.id);
		thought.content = body.content;
		thought.tagLabels = body.tagLabels;
		thought.overwrite();

		thought.tagLabels
			.filter((x) => !oldThought.tagLabels.includes(x))
			.forEach((label) => addTagIndex(label, thought.id));

		oldThought.tagLabels
			.filter((x) => !thought.tagLabels.includes(x))
			.forEach((label) => removeTagIndex(label, thought.id));

		const oldMentionedIds = Thought.getMentionedIds(oldThought.content);
		const newMentionedIds = Thought.getMentionedIds(thought.content);
		oldMentionedIds
			.filter((x) => !newMentionedIds.includes(x))
			.forEach((id) => Thought.parse(id).removeMention(thought.id));
		newMentionedIds
			.filter((x) => !oldMentionedIds.includes(x))
			.forEach((id) => Thought.parse(id).addMention(thought.id));
	} else {
		thought = new Thought({ ...body, createDate }, true);
	}

	addTagsByLabel(thought.tagLabels);
	const mentionedThoughts: Record<string, Thought> = {};
	Thought.getMentionedIds(thought.content).forEach(
		(id) => (mentionedThoughts[id] = Thought.parse(id)),
	);
	res.send({ mentionedThoughts, thought });
	debouncedSnapshot();
};

export default writeThought;
