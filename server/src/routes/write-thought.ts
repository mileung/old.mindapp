import { RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { debouncedSnapshot } from '../utils/git';
import { Personas } from '../types/Personas';
import env from '../utils/env';
import { inGroup } from '../db';

const writeThought: RequestHandler = async (req, res) => {
	// return res.send({});
	const { message } = req.body as {
		message: { from?: string; thought: { signature: string } & Thought['signedProps'] };
		fromSignature?: string;
	};
	// console.log('message:', message);
	// console.log('thought:', message.thought);
	if (env.GLOBAL_HOST && !message.from) throw new Error('Anon cannot write in global spaces');
	if ((message.from || '') !== (message.thought.authorId || '')) {
		throw new Error('message sender and thought author do not match');
	}

	const fromExistingMember = await inGroup(message.from);
	if (fromExistingMember?.frozen) throw new Error('Frozen persona');
	if (env.GLOBAL_HOST && !env.ANYONE_CAN_JOIN && !fromExistingMember) {
		throw new Error('Access denied');
	}
	if (!message.thought.content) {
		throw new Error('No message.thought.content');
	}
	if ((message.thought.content || '').length > 1000000) {
		throw new Error('message.thought.content exceeds limit');
	}
	if ((message.thought.authorId || '') !== (message.from || '')) {
		throw new Error('message.from is not message.thought.authorId');
	}

	let newThought: Thought;

	const oldThought = await Thought.query(
		Thought.calcId(
			//
			message.thought.createDate,
			message.thought.authorId,
			message.thought.spaceHost,
		),
	);
	// console.log('oldThought:', oldThought);
	if (oldThought) {
		if (env.GLOBAL_HOST && (await oldThought.hasUserInteraction())) {
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
		const now = Date.now();
		if (now < message.thought.createDate || now - message.thought.createDate > 10000) {
			throw new Error('createDate out of sync');
		}
		newThought = new Thought(message.thought, true);
	}

	const mentionedThoughts: Record<string, Thought> = {};
	const names: Record<string, string> = {};
	for (let i = 0; i < newThought.mentionedIds.length; i++) {
		const id = newThought.mentionedIds[i];
		const thought = await Thought.query(id);
		if (thought) {
			mentionedThoughts[id] = thought;
			const { authorId, spaceHost } = mentionedThoughts[id];
			if (!env.GLOBAL_HOST && authorId) {
				const name = await Personas.getDefaultName(authorId);
				name && (names[authorId] = name);
			}
		}
	}
	res.send({ names, mentionedThoughts, thought: newThought.clientProps });
	debouncedSnapshot();
};

export default writeThought;
