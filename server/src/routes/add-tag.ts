import { RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { spacesPath } from '../utils/files';
import { Tag } from '../types/Tag';

const addTag: RequestHandler = (req, res, next) => {
	console.log('next:', next);

	// const tagsPath = path.join(spacesPath, spaceId, 'tags.json');
	// const tags: Tag[] = JSON.parse(fs.readFileSync(tagsPath).toString());

	res.send({});
};

export default addTag;
