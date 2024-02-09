import { Request, RequestHandler } from 'express';
import path from 'path';
import fs from 'fs';
import { Note } from '../types/Note';
import { getNotePath, parseFile, spacesPath, writeFile, writeIfDne } from '../utils/files';
import { day } from '../utils/time';

const writeNote: RequestHandler = (req: Request & { body: Note }, res) => {
	const now = Date.now();
	const spaceId = 'localhost';
	const note = new Note(now, req.body.note.authorId, req.body.note.content, req.body.note.tags);
	const authorId = note.authorId; // TODO: make more robust user id system
	console.log('note:', note);

	const filePath = getNotePath(spaceId, now, authorId);

	if (req.body.parentCreateDate && req.body.parentAuthorId) {
		const parentCreateDate = req.body.parentCreateDate;
		const parentAuthorId = req.body.parentAuthorId;
		note.parentId = parentCreateDate + '.' + parentAuthorId;

		const parentFilePath = getNotePath(spaceId, parentCreateDate, parentAuthorId);
		const parentNote = parseFile<Note>(parentFilePath);
		parentNote.childrenIds = parentNote.childrenIds || [];
		parentNote.childrenIds.push(now + '.' + authorId);
		// TODO: revert if Duplicate timestamp entry?
		writeFile(parentFilePath, JSON.stringify(parentNote));
		console.log('parentFilePath:', parentFilePath);
		console.log('parentNote:', parentNote);
	}

	if (!writeIfDne(filePath, JSON.stringify(note))) {
		// TODO: the client should retry so the user doesn't have to manually trigger again
		throw new Error('Duplicate timestamp entry');
	}

	res.send({ createDate: now });
};

export default writeNote;
