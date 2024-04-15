import { Request, RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { addPathsByTag, removePathsByTag } from '../utils';
import { addTagsByLabel } from '../utils/tags';
import { debouncedSnapshot } from '../utils/git';
import { Personas } from '../types/Personas';

const writeThought: RequestHandler = (req, res) => {
	// return res.send({});
	let body = req.body as {
		editId: string;
		authorId: string;
		spaceId: string;
		content: string;
		tags: string[];
		parentId: string;
	};

	const createDate = Date.now();
	let newThought: Thought;
	if (body.editId) {
		const oldThought = Thought.parse(body.editId);
		newThought = new Thought(oldThought);
		newThought.content = body.content;
		newThought.tags = body.tags;
		oldThought.authorId && newThought.signAs(oldThought.authorId);
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

	addTagsByLabel(newThought.tags || []);
	const mentionedThoughts: Record<string, Thought> = {};
	const defaultNames: Record<string, string> = {};
	newThought.mentionedIds.forEach((id) => {
		mentionedThoughts[id] = Thought.parse(id);
		const { authorId } = mentionedThoughts[id];
		if (authorId) {
			defaultNames[authorId] = Personas.getDefaultName(authorId);
		}
	});
	res.send({ defaultNames, mentionedThoughts, thought: newThought });
	debouncedSnapshot();
};

export default writeThought;
