import { RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { indicesPath, parseFile } from '../utils/files';

const rootsPerLoad = 8;
const searchLocalThoughts: RequestHandler = (req, res) => {
	const roots: Thought[] = [];
	const mentionedIds = new Set<string>();
	const moreMentions: Record<string, Thought> = {};

	const { tagLabels, other, oldToNew, ignoreRootIds, thoughtsBeyond } = req.body as {
		tagLabels: string[];
		other: string[];
		oldToNew: boolean;
		ignoreRootIds: string[];
		thoughtsBeyond: number;
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
