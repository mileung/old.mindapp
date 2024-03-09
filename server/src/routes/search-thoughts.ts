import fs from 'fs';
import path from 'path';
import { RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { indicesPath, parseFile, timelinePath } from '../utils/files';

const rootsPerLoad = 8;
const searchLocalThoughts: RequestHandler = (req, res) => {
	const {
		thoughtId,
		tags = [],
		other,
		oldToNew,
		ignoreRootIds,
		thoughtsBeyond,
	} = req.body as {
		thoughtId: string;
		tags: string[];
		other: string[];
		oldToNew: boolean;
		ignoreRootIds: string[];
		thoughtsBeyond: number;
	};
	const roots: Thought[] = [];
	const moreMentions: Record<string, Thought> = {};
	let thoughtIds: undefined | string[];
	let jsonFiles: undefined | string[];
	// console.log('other:', other);

	if (thoughtId) {
		try {
			const thought = Thought.parse(thoughtId);
			const { rootThought } = thought;
			roots.push(rootThought);
			[...new Set(rootThought.expand())].forEach((id) => (moreMentions[id] = Thought.parse(id)));
			thoughtIds = [thoughtId];

			// going to a thoughtId page will just load all the mentions at once
			// TODO: paginate later
			thought.mentionedByIds?.length &&
				thoughtIds.push(
					...thought.mentionedByIds.sort((a, b) =>
						oldToNew ? a.localeCompare(b) : b.localeCompare(a),
					),
				);
		} catch (error) {
			return res.send({ moreMentions: {}, moreRoots: [], moreMentionedByRoots: [] });
		}
	} else if (tags.length) {
		const indices = parseFile<Record<string, string[]>>(indicesPath);
		thoughtIds = [...new Set(tags.flatMap((tag) => indices[tag] || []))].sort((a, b) =>
			oldToNew ? a.localeCompare(b) : b.localeCompare(a),
		);
	} else {
		// OPTIMIZE: this is lazy cuz it gets all the files
		// https://www.fusejs.io/api/options.html
		// Maybe use this idk
		function getAllJsonFiles(folderPath: string, fileList: string[] = []) {
			const files = fs.readdirSync(folderPath);
			files.forEach((file) => {
				const filePath = path.join(folderPath, file);
				if (fs.statSync(filePath).isDirectory()) {
					getAllJsonFiles(filePath, fileList);
				} else if (path.extname(file) === '.json') {
					fileList.push(filePath);
				}
			});
			return fileList;
		}
		jsonFiles = getAllJsonFiles(timelinePath).sort((a, b) =>
			oldToNew ? a.localeCompare(b) : b.localeCompare(a),
		);
	}

	const mentionedIds = new Set<string>();
	let latestCreateDate = oldToNew ? Infinity : 0;

	const arr = (thoughtIds || jsonFiles)!;
	for (let i = 0; i < arr.length; i++) {
		const idOrPath = arr[i];
		let thought = thoughtIds ? Thought.parse(idOrPath) : Thought.read(idOrPath);
		if (other.length && -1 === other.findIndex((term) => thought.content.includes(term))) continue;
		thought = thought.rootThought;

		if (
			(oldToNew ? thoughtsBeyond < thought.createDate : thoughtsBeyond > thought.createDate) &&
			!ignoreRootIds.find((id) => id === thought.id) &&
			!roots.find((root) => root.id === thought.id)
		) {
			thought.expand().forEach((id) => mentionedIds.add(id));
			roots.push(thought);
			latestCreateDate = oldToNew
				? Math.min(latestCreateDate, thought.createDate)
				: Math.max(latestCreateDate, thought.createDate);
		}
		if (roots.length === rootsPerLoad) break;
	}

	mentionedIds.forEach((id) => (moreMentions[id] = Thought.parse(id)));

	res.send({ latestCreateDate, moreMentions, moreRoots: roots });
};

export default searchLocalThoughts;
