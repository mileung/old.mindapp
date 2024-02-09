import { RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { isDirectory, isFile, parseFile, spacesPath } from '../utils/files';
import { Note } from '../types/Note';
import { day } from '../utils/time';

const notesPerLoad = 8;
const getLocalNotes: RequestHandler = (req, res) => {
	const notes: Note[] = [];

	const spaceIds = typeof req.query.spaceIds === 'string' ? req.query.spaceIds.split(',') : [];
	// console.log('spaceIds:', spaceIds);
	// const searchedKeywords = req.query.searchedKeywords;
	const oldToNew = req.query.oldToNew === 'true';
	const notesAfter = +req.query.notesAfter! || Date.now();
	// console.log("notesAfter:", notesAfter);
	const startingDay = Math.floor(notesAfter / day);
	// console.log("startingDay:", startingDay);

	const spacesDirs = fs
		.readdirSync(spacesPath)
		.filter((id) => (spaceIds.length ? spaceIds.includes(id) : true));
	// console.log('spacesDirs:', spacesDirs);
	for (let i = 0; i < spacesDirs.length; i++) {
		const spaceId = spacesDirs[i];
		// console.log('spaceId:', spaceId);
		const spaceIdPath = path.join(spacesPath, spaceId);
		if (!isDirectory(spaceIdPath)) continue;
		const periodDirs = fs.readdirSync(spaceIdPath).sort((a, b) => (oldToNew ? +a - +b : +b - +a));

		for (let i = 0; i < periodDirs.length; i++) {
			const period = periodDirs[i];
			// console.log('period:', period);
			if (notes.length === notesPerLoad) break;
			if (startingDay % +period >= 100) continue;
			const periodPath = path.join(spaceIdPath, period);
			// console.log('periodPath:', periodPath);
			if (!isDirectory(periodPath)) continue;
			const dayDirs = fs.readdirSync(periodPath).sort((a, b) => (oldToNew ? +a - +b : +b - +a));

			// console.log('dayDirs:', dayDirs);
			for (let i = 0; i < dayDirs.length; i++) {
				const day = dayDirs[i];
				// console.log('day:', day);
				if (notes.length === notesPerLoad) break;
				if (oldToNew ? startingDay > +day : startingDay < +day) continue;
				const dayPath = path.join(periodPath, day);
				if (!isDirectory(dayPath)) continue;
				const notesDir = fs.readdirSync(dayPath).sort((a, b) => {
					a = a.substring(0, a.indexOf('.'));
					b = b.substring(0, b.indexOf('.'));
					return oldToNew ? +a - +b : +b - +a;
				});
				for (let i = 0; i < notesDir.length; i++) {
					const fileName = notesDir[i];
					const noteTimestamp = Number(fileName.substring(0, fileName.indexOf('.')));
					// console.log('noteTimestamp:', noteTimestamp);
					if (oldToNew ? notesAfter >= noteTimestamp : notesAfter <= noteTimestamp) continue;
					// console.log('fileName:', fileName);
					const filePath = path.join(dayPath, fileName);
					if (isFile(filePath) && fileName.endsWith('.json')) {
						if (isNaN(noteTimestamp)) continue;
						notes.push(parseFile(filePath));
						if (notes.length === notesPerLoad) break;
					}
				}
			}
		}
	}

	// console.log('notes:', notes);
	res.status(200).json(notes);
};

export default getLocalNotes;
