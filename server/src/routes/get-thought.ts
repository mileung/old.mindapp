import { Request, RequestHandler } from 'express';
import { Thought } from '../types/Thought';

const getThought: RequestHandler = (req: Request & { body: Thought }, res) => {
	const thought = Thought.parse(req.body.thoughtId);
	res.send(thought);
};

export default getThought;
