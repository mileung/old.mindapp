import { Request, RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { addTagIndex, addTagsByLabel, removeTagIndex, sortUniArr } from '../utils/tags';
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
		thought.tags = body.tags;
		thought = new Thought(thought);
		thought.overwrite();

		thought.tags
			.filter((x) => !oldThought.tags.includes(x))
			.forEach((tag) => addTagIndex(tag, thought.id));

		oldThought.tags
			.filter((x) => !thought.tags.includes(x))
			.forEach((tag) => removeTagIndex(tag, thought.id));

		const oldMentionedIds = oldThought.mentionedIds;
		const newMentionedIds = thought.mentionedIds;
		oldMentionedIds
			.filter((x) => !newMentionedIds.includes(x))
			.forEach((id) => Thought.parse(id).removeMention(thought.id));
		newMentionedIds
			.filter((x) => !oldMentionedIds.includes(x))
			.forEach((id) => Thought.parse(id).addMention(thought.id));
	} else {
		thought = new Thought({ ...body, createDate }, true);
	}

	addTagsByLabel(thought.tags);
	const mentionedThoughts: Record<string, Thought> = {};
	thought.mentionedIds.forEach((id) => (mentionedThoughts[id] = Thought.parse(id)));
	res.send({ mentionedThoughts, thought });
	debouncedSnapshot();
};

export default writeThought;
