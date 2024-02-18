import { RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { isDirectory, isFile, timelinePath } from '../utils/files';
import { day } from '../utils/time';
import { Thought } from '../types/Thought';

const rootsPerLoad = 8;
const getLocalThoughts: RequestHandler = (req, res) => {
	const roots: Thought[] = [];
	const { oldToNew, ignoreRootIds, thoughtsBeyond } = req.body as {
		oldToNew: boolean;
		ignoreRootIds: string[];
		thoughtsBeyond: number;
	};

	const startingDay = Math.floor(thoughtsBeyond / day);
	let latestCreateDate = oldToNew ? Infinity : 0;

	const periodDirs = fs.readdirSync(timelinePath).sort((a, b) => (oldToNew ? +a - +b : +b - +a));
	for (let i = 0; i < periodDirs.length; i++) {
		const period = periodDirs[i];
		if (roots.length === rootsPerLoad) break;
		if (oldToNew ? startingDay > +period + 100 : startingDay < +period) continue;
		const periodPath = path.join(timelinePath, period);
		if (!isDirectory(periodPath)) continue;
		const dayDirs = fs.readdirSync(periodPath).sort((a, b) => (oldToNew ? +a - +b : +b - +a));
		for (let i = 0; i < dayDirs.length; i++) {
			const day = dayDirs[i];
			if (roots.length === rootsPerLoad) break;
			if (oldToNew ? startingDay > +day + 100 : startingDay < +day) continue;
			const dayPath = path.join(periodPath, day);
			if (!isDirectory(dayPath)) continue;
			const thoughtFiles = fs.readdirSync(dayPath).sort((a, b) => {
				a = a.split('.', 1)[0];
				b = b.split('.', 1)[0];
				return oldToNew ? +a - +b : +b - +a;
			});
			for (let i = 0; i < thoughtFiles.length; i++) {
				const fileName = thoughtFiles[i];
				const createDate = Number(fileName.split('.', 1)[0]);
				if (isNaN(createDate)) continue;
				const filePath = path.join(dayPath, fileName);
				if (isFile(filePath) && fileName.endsWith('.json')) {
					let thought = Thought.read(filePath).rootThought;
					if (
						!ignoreRootIds.find((id) => id === thought.id) &&
						!roots.find((root) => root.id === thought.id)
					) {
						thought.expand();
						roots.push(thought);
						latestCreateDate = oldToNew
							? Math.min(latestCreateDate, thought.createDate)
							: Math.max(latestCreateDate, thought.createDate);
					}
					if (roots.length === rootsPerLoad) break;
				}
			}
		}
	}

	res.status(200).json({ latestCreateDate, moreRoots: roots });
};

export default getLocalThoughts;
