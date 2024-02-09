import { RequestHandler } from 'express';
import path from 'path';
import { parseFile, spacesPath, writeIfDne } from '../utils/files';
import { Tag } from '../types/Tag';

const getTags: RequestHandler = (req, res) => {
	const spaceId = 'localhost';
	const tagsPath = path.join(spacesPath, spaceId, 'tags.json');
	writeIfDne(tagsPath, JSON.stringify([]));
	const tags = parseFile<Tag[]>(tagsPath);
	res.send(tags);
};

export default getTags;
