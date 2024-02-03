import { Request, RequestHandler } from 'express';
import path from 'path';
import { Note } from '../types/Note';
import { spacesPath, touchIfDne } from '../utils/files';
import { day } from '../utils/time';

const writeNote: RequestHandler = (req: Request & { body: Note }, res) => {
	const now = Date.now();
	const authorId = req.body.authorId; // TODO: make more robust user id system
	// const spaceId = req.headers.host!;
	const spaceId = req.hostname;
	// console.log('spaceId:', spaceId);
	const note = new Note(
		now,
		req.body.authorId,
		req.body.content,
		req.body.tags,
		req.body.parent,
		req.body.children
	);
	// console.log('note:', note);

	const daysSince1970 = now / day;
	const period = Math.floor(daysSince1970 / 100) * 100 + '';

	const filePath = path.join(
		spacesPath,
		spaceId,
		period,
		Math.floor(daysSince1970) + '',
		`${now}.${authorId}.json`
	);

	if (!touchIfDne(filePath, JSON.stringify(note))) {
		throw new Error('Duplicate timestamp entry');
	}
	res.send({ createDate: now });
};

export default writeNote;
