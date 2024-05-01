import { RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { addTagsByLabel } from '../utils/tags';
import { debouncedSnapshot } from '../utils/git';
import { Personas } from '../types/Personas';
import env from '../utils/env';
import { inGroup } from '../utils/security';

const writeThought: RequestHandler = async (req, res) => {
	// return res.send({});
	const { message } = req.body as {
		message: { from?: string; thought: Thought['clientProps'] };
		fromSignature?: string;
	};
	// console.log('message:', message);

	if ((message.from || '') !== (message.thought.authorId || '')) {
		throw new Error('message sender and thought author do not match');
	}

	const fromExistingMember = await inGroup(message.from);
	if (env.isGlobalSpace && !env.anyoneCanJoin && !fromExistingMember) {
		throw new Error('Access denied');
	}
	if (fromExistingMember?.frozen) throw new Error('Frozen persona');

	let newThought: Thought;
	const oldThought = await Thought.query(
		Thought.calcId(
			message.thought.createDate,
			message.thought.authorId || '',
			message.thought.spaceHostname || '',
		),
	);

	if (oldThought) {
		if (env.isGlobalSpace && (await oldThought.hasUserInteraction())) {
			// TODO: make this atomic with the overwrite
			throw new Error('Global thoughts with user interaction cannot be edited');
		}
		newThought = new Thought({
			...oldThought,
			content: message.thought.content,
			tags: message.thought.tags,
			signature: message.thought.signature,
		});
		newThought.overwrite();
	} else {
		newThought = new Thought(message.thought, true);
	}

	!env.isGlobalSpace && addTagsByLabel(newThought.tags);
	const mentionedThoughts: Record<string, Thought> = {};
	const names: Record<string, string> = {};
	for (let i = 0; i < newThought.mentionedIds.length; i++) {
		const id = newThought.mentionedIds[i];
		const thought = await Thought.query(id);
		if (thought) {
			mentionedThoughts[id] = thought;
			const { authorId, spaceHostname } = mentionedThoughts[id];
			if (!env.isGlobalSpace && authorId) {
				const name = await Personas.getDefaultName(authorId);
				name && (names[authorId] = name);
			}
		}
	}
	res.send({ names, mentionedThoughts, thought: newThought });
	debouncedSnapshot();
};

export default writeThought;
