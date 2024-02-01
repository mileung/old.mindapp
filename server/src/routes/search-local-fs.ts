import { RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { isDirectory, isFile, spacesPath } from '../utils/files';
import { Note } from '../types/Note';
import { day } from '../utils/time';

const notesPerPage = 8;
const searchLocalFs: RequestHandler = (req, res) => {
	const notes: Note[] = [];

	const spaceIds = typeof req.query.spaceIds === 'string' ? req.query.spaceIds.split(',') : [];
	// const searchedKeywords = req.query.searchedKeywords;
	const oldToNew = req.query.oldToNew === 'true';
	const pageAfter = +req.query.pageAfter! || Date.now();
	// console.log("pageAfter:", pageAfter);
	const startingDay = Math.floor(pageAfter / day);
	// console.log("startingDay:", startingDay);

	const spacesDir = fs
		.readdirSync(spacesPath)
		.filter((id) => (spaceIds.length ? spaceIds.includes(id) : true));
	for (let i = 0; i < spacesDir.length; i++) {
		const spaceId = spacesDir[i];
		const spaceIdPath = path.join(spacesPath, spaceId);
		if (!isDirectory(spaceIdPath)) return;
		const periodDirs = fs.readdirSync(spaceIdPath).sort((a, b) => (oldToNew ? +a - +b : +b - +a));
		// console.log("periodDirs:", periodDirs);

		for (let i = 0; i < periodDirs.length; i++) {
			const period = periodDirs[i];
			// console.log("period:", period);
			if (notes.length === notesPerPage) break;
			if (startingDay % +period >= 100) continue;
			const periodPath = path.join(spaceIdPath, period);
			if (!isDirectory(periodPath)) return;
			const dayDirs = fs.readdirSync(periodPath).sort((a, b) => (oldToNew ? +a - +b : +b - +a));

			// console.log("dayDirs:", dayDirs);
			for (let i = 0; i < dayDirs.length; i++) {
				const day = dayDirs[i];
				// console.log("day:", day);
				if (notes.length === notesPerPage) break;
				if (oldToNew ? startingDay > +day : startingDay < +day) continue;
				const dayPath = path.join(periodPath, day);
				if (!isDirectory(dayPath)) return;
				const notesDir = fs.readdirSync(dayPath).sort((a, b) => {
					a = a.substring(0, a.indexOf('.'));
					b = b.substring(0, b.indexOf('.'));
					return oldToNew ? +a - +b : +b - +a;
				});
				for (let i = 0; i < notesDir.length; i++) {
					const fileName = notesDir[i];
					const noteTimestamp = Number(fileName.substring(0, fileName.indexOf('.')));
					// console.log("noteTimestamp:", noteTimestamp);
					if (oldToNew ? pageAfter >= noteTimestamp : pageAfter <= noteTimestamp) continue;
					// console.log("fileName:", fileName);
					const filePath = path.join(dayPath, fileName);
					if (isFile(filePath) && fileName.endsWith('.json')) {
						if (isNaN(noteTimestamp)) return;
						notes.push(JSON.parse(fs.readFileSync(filePath).toString()));
						if (notes.length === notesPerPage) break;
					}
				}
			}
		}
	}

	res.status(200).json(notes);
};

export default searchLocalFs;
