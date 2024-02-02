import { RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { spacesPath } from '../utils/files';

export type Tags = {
	tag: string;
	subsetOf: string[];
	subsets: string[];
};

const addTag: RequestHandler = (req, res) => {
	const spaceId = req.query.spaceId;
	if (typeof spaceId !== 'string') return res.sendStatus(400);
	const tagsPath = path.join(spacesPath, spaceId, 'tags.json');

	res.sendStatus(200);
};

export default addTag;
