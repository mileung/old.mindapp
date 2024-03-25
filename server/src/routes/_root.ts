import { RequestHandler } from 'express';

const root: RequestHandler = (req, res) => {
	res.send({});
};

export default root;
