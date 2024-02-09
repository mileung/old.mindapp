import { Request, RequestHandler } from 'express';
import { Note } from '../types/Note';
import { getNotePath, parseFile } from '../utils/files';

const getNote: RequestHandler = (req: Request & { body: Note }, res) => {
	const spaceId = 'localhost';
	const createDate = req.body.createDate;
	const authorId = req.body.authorId;
	const filePath = getNotePath(spaceId, createDate, authorId);
	const note = parseFile<Note>(filePath);
	res.send(note);
};

export default getNote;
