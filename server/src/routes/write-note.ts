import { Request, RequestHandler } from 'express';
import path from 'path';
import { Note } from '../types/Note';
import { spacesPath, touchIfDne } from '../utils/files';
import { day } from '../utils/time';

const writeNote: RequestHandler = (req: Request & { body: Note }, res) => {
	const now = Date.now();
	const authorId = req.body.authorId; // TODO: make more robust user id system
	const spaceId = 'localhost';
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
		// TODO: the client should retry so the user doesn't have to manually trigger again
		throw new Error('Duplicate timestamp entry');
	}
	res.send({ createDate: now });
};

export default writeNote;
