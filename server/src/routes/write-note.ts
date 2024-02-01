import { Request, RequestHandler } from 'express';
import path from 'path';
import { Note } from '../types/Note';
import { spacesPath, touchIfDne } from '../utils/files';
import { day } from '../utils/time';

const writeNote: RequestHandler = (req: Request & { body: Note }, res) => {
	const now = Date.now();
	const authorId = startDate; // TODO: make more robust user id system
	const spaceId = req.headers.host!;
	console.log('spaceId:', spaceId);
	let note: Note;
	try {
		note = new Note(
			now,
			authorId,
			req.body.content,
			req.body.tags,
			req.body.parent,
			req.body.children
		);
	} catch (error) {
		return res.status(400).send('Invalid note');
	}
	const daysSince1970 = now / day;
	const period = Math.floor(daysSince1970 / 100) * 100 + '';

	const filePath = path.join(
		spacesPath,
		spaceId,
		period,
		Math.floor(daysSince1970) + '',
		`${now}.${authorId}.json`
	);

	if (!touchIfDne(filePath, JSON.stringify(note!))) {
		return res.sendStatus(500);
	}
	res.sendStatus(200);
};

export default writeNote;
