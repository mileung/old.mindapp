import { RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { spacesPath } from '../utils/files';
import { Tag } from '../types/Tag';

const addTag: RequestHandler = (req, res, next) => {
	console.log('next:', next);
	const spaceId = 'localhost';
	const newTag = new Tag(req.body.tag, req.body.subsetOf);
	const tagsPath = path.join(spacesPath, spaceId, 'tags.json');
	const tags: Tag[] = JSON.parse(fs.readFileSync(tagsPath).toString());
	tags.push(newTag);
	tags.sort((a, b) => (a.tag < b.tag ? -1 : 1));
	fs.writeFileSync(tagsPath, JSON.stringify(tags));
	res.send({});
};

export default addTag;
