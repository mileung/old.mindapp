import { RequestHandler } from 'express';
import { getFilePath } from '../utils/files';

export const getFile: RequestHandler = (req, res, next) => {
	const fileName = req.params.fileName;
	const filePath = getFilePath(fileName);
	res.sendFile(filePath, (err) => next(err));
};
