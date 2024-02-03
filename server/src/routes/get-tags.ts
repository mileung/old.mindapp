import { RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { spacesPath, touchIfDne } from '../utils/files';
import { Tag } from '../types/Tag';

const getTags: RequestHandler = (req, res) => {
	const spaceId = req.query.spaceId;
	if (typeof spaceId !== 'string') return res.sendStatus(400);
	const tagsPath = path.join(spacesPath, spaceId, 'tags.json');
	touchIfDne(tagsPath, JSON.stringify([]));
	const tags: Tag[] = JSON.parse(fs.readFileSync(tagsPath).toString());
	res.send(tags);
};

export default getTags;
