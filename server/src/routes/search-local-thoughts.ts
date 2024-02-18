import { RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { indicesPath, parseFile } from '../utils/files';

const rootsPerLoad = 8;
const searchLocalThoughts: RequestHandler = (req, res) => {
	const roots: Thought[] = [];
	const { oldToNew, tagLabels, other, ignoreRootIds, thoughtsBeyond, rootsAfter } = req.body as {
		oldToNew: boolean;
		tagLabels: string[];
		other: string[];
		ignoreRootIds: string[];
		thoughtsBeyond: number;
		rootsAfter: number;
	};
	let latestCreateDate = oldToNew ? Infinity : 0;
	const indices = parseFile<Record<string, string[]>>(indicesPath);
	const thoughtIds: string[] = [];

	// Calculate sublabels on the client
	tagLabels.forEach((label) => {
		thoughtIds.push(...(indices[label] || []));
	});
	thoughtIds.sort((a, b) => (oldToNew ? a.localeCompare(b) : b.localeCompare(a)));

	for (let i = 0; i < thoughtIds.length; i++) {
		const id = thoughtIds[i];
		let thought = Thought.parse(id).rootThought;
		if (
			(oldToNew ? rootsAfter < thought.createDate : thoughtsBeyond > thought.createDate) &&
			!ignoreRootIds.find((id) => id === thought.id) &&
			!roots.find((root) => root.id === thought.id)
		) {
			thought.expand();
			roots.push(thought);
		}
		if (roots.length === rootsPerLoad) break;
	}

	res.send({ latestCreateDate, moreRoots: roots });
};

export default searchLocalThoughts;
