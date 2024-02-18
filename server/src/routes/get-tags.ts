import { RequestHandler } from 'express';
import { parseFile, tagsPath, touchIfDne } from '../utils/files';
import { Tag } from '../types/Tag';

const getTags: RequestHandler = (req, res) => {
	touchIfDne(tagsPath, JSON.stringify([]));
	const tags = parseFile<Tag[]>(tagsPath);
	res.send(tags);
};

export default getTags;
