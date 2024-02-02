import { RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { spacesPath } from '../utils/files';
import { Tags } from './add-tag';

const removeTag: RequestHandler = (req, res) => {
	const spaceId = req.query.spaceId;
	if (typeof spaceId !== 'string') return res.sendStatus(400);
	const tagsPath = path.join(spacesPath, spaceId, 'tags.json');
	const tags: Tags = JSON.parse(fs.readFileSync(tagsPath).toString());
	res.status(200).json(tags);
};

export default removeTag;
