import { Request, RequestHandler } from 'express';
import { Thought } from '../types/Thought';

const getThought: RequestHandler = (req: Request & { body: Thought }, res) => {
	try {
		const thought = Thought.parse(req.query.thoughtId as string);
		const { rootThought } = thought;
		const moreMentions: Record<string, Thought> = {};
		[...new Set(rootThought.expand())].forEach((id) => (moreMentions[id] = Thought.parse(id)));
		res.send({ moreMentions, rootThought });
	} catch (error) {
		res.send({ moreMentions: {}, rootThought: null });
	}
};

export default getThought;
