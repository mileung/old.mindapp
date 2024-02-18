import { Request, RequestHandler } from 'express';
import { Thought } from '../types/Thought';

const getThought: RequestHandler = (req: Request & { body: Thought }, res) => {
	try {
		const thought = Thought.parse(req.query.thoughtId as string);
		const { rootThought } = thought;
		rootThought.expand();
		res.send({ rootThought });
	} catch (error) {
		res.send({ rootThought: null });
	}
};

export default getThought;
