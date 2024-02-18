import { Request, RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { addTagIndex, addTagsByLabel, removeTagIndex } from '../utils/tags';

const writeThought: RequestHandler = (req: Request & { body: Thought }, res) => {
	// return res.send({});
	let { parentId, createDate, authorId, spaceId, content, tagLabels } = req.body as Thought;
	const editing = !!createDate;
	createDate = createDate || Date.now(); // can be used for editing
	let thought: Thought;
	if (editing) {
		thought = Thought.parse(`${createDate}.${authorId}.${spaceId}`);
		const oldTagLabels = thought.tagLabels;
		const oldMentionedIds = thought.mentionedIds;
		thought.content = content;
		thought.tagLabels = tagLabels;
		thought.overwrite();

		const addedTagLabels = tagLabels.filter((x) => !oldTagLabels.includes(x));
		const removedTagLabels = oldTagLabels.filter((x) => !tagLabels.includes(x));
		addedTagLabels.forEach((label) => addTagIndex(label, thought.id));
		removedTagLabels.forEach((label) => removeTagIndex(label, thought.id));
		addTagsByLabel([...thought.tagLabels, ...oldTagLabels]);

		const newMentionedIds = thought.mentionedIds;
		const addedMentionedIds = newMentionedIds.filter((x) => !oldMentionedIds.includes(x));
		const removedMentionedIds = oldMentionedIds.filter((x) => !newMentionedIds.includes(x));
		addedMentionedIds.forEach((id) => Thought.parse(id).addMention(thought.id));
		removedMentionedIds.forEach((id) => Thought.parse(id).removeMention(thought.id));
	} else {
		thought = new Thought(
			{
				parentId,
				createDate,
				authorId,
				spaceId,
				content,
				tagLabels,
			},
			true,
		);
		thought.tagLabels.forEach((label) => addTagIndex(label, thought.id));
		addTagsByLabel(thought.tagLabels);
		thought.mentionedIds.forEach((id) => Thought.parse(id).addMention(thought.id));
	}

	res.status(200).send(thought);
};

export default writeThought;
