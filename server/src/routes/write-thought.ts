import { Request, RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { addPathsByTag, index, removePathsByTag } from '../utils';
import { addTagsByLabel } from '../utils/tags';
import { debouncedSnapshot } from '../utils/git';

const writeThought: RequestHandler = (req: Request & { body: Thought }, res) => {
	// return res.send({});
	let body = req.body as Thought;
	const editing = !!body.createDate;
	const createDate = body.createDate || Date.now(); // can be used for editing
	let newThought: Thought;
	if (editing) {
		const oldThought = Thought.parse(`${createDate}.${body.authorId}.${body.spaceId}`);
		newThought = new Thought({
			...oldThought,
			content: body.content,
			tags: body.tags,
		});
		newThought.overwrite();

		oldThought.mentionedIds
			.filter((x) => !newThought.mentionedIds.includes(x))
			.forEach((id) => Thought.parse(id).removeMention(newThought.id));
		newThought.mentionedIds
			.filter((x) => !oldThought.mentionedIds.includes(x))
			.forEach((id) => Thought.parse(id).addMention(newThought.id));

		newThought.tags
			.filter((x) => !oldThought.tags.includes(x))
			.forEach((tag) => addPathsByTag(tag, newThought));
		oldThought.tags
			.filter((x) => !newThought.tags.includes(x))
			.forEach((tag) => removePathsByTag(tag, oldThought));
	} else {
		newThought = new Thought({ ...body, createDate }, true);
	}

	addTagsByLabel(newThought.tags);
	const mentionedThoughts: Record<string, Thought> = {};
	newThought.mentionedIds.forEach((id) => (mentionedThoughts[id] = Thought.parse(id)));
	res.send({ mentionedThoughts, thought: newThought });
	debouncedSnapshot();
};

export default writeThought;
