import { RequestHandler } from 'express';
import { parseFile } from '../utils/files';
import { WorkingDirectory } from '../types/WorkingDirectory';

const addSpace: RequestHandler = (req, res) => {
	const ____ = parseFile<___>(WorkingDirectory.current.___);
	res.send(____);
};

export default addSpace;
