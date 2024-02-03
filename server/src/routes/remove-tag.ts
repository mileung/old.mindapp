import { RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { spacesPath } from '../utils/files';
import { Tag } from '../types/Tag';

const removeTag: RequestHandler = (req, res) => {
	const spaceId = 'localhost';
	const tagsPath = path.join(spacesPath, spaceId, 'tags.json');
	const tags: Tag[] = JSON.parse(fs.readFileSync(tagsPath).toString());
	res.status(200).json(tags);
};

export default removeTag;
