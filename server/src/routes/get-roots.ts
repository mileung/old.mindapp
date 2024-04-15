import { RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { closestIndexInAllPaths, index } from '../utils';
import { isRecord } from '../utils/js';
import { Personas } from '../types/Personas';

const getLocalThoughts: RequestHandler = (req, res) => {
	const {
		thoughtId,
		tags = [],
		other,
		freeForm,
		oldToNew,
		ignoreRootIds,
		thoughtsBeyond,
	} = req.body as {
		thoughtId?: string;
		tags?: string[];
		other?: string[];
		freeForm: boolean;
		oldToNew: boolean;
		ignoreRootIds: string[];
		thoughtsBeyond: number;
	};
	const roots: Thought[] = [];
	const mentionedIds = new Set<string>();
	const authorIds = new Set<string>();
	const moreMentions: Record<string, Thought> = {};
	const moreDefaultNames: Record<string, string> = {};
	let latestCreateDate = oldToNew ? 0 : Number.MAX_SAFE_INTEGER;

	const thoughtIdsToParse = thoughtId ? [thoughtId] : index.allThoughtIds;
	let direction: number;
	let i: number;
	if (thoughtId) {
		direction = 1;
		i = 0;
		try {
			const thought = Thought.parse(thoughtId);
			// const { rootThought } = thought;
			// roots.push(rootThought);
			// const expansion = rootThought.expand();
			// [...new Set(expansion.allMentionedIds)].forEach((id) => {
			// 	moreMentions[id] = Thought.parse(id);
			// 	authorIds.add(moreMentions[id].authorId);
			// });
			// expansion.allAuthorIds.forEach((id) => authorIds.add(id));
			if (thought.mentionedByIds?.length) {
				thoughtIdsToParse.push(
					...[...thought.mentionedByIds].sort((a, b) =>
						oldToNew ? a.localeCompare(b) : b.localeCompare(a),
					),
				);
			}
		} catch (error) {
			return res.send({ moreMentions: {}, moreRoots: [] });
		}
	} else {
		direction = oldToNew ? 1 : -1;
		i =
			closestIndexInAllPaths(thoughtsBeyond) +
			(thoughtsBeyond === (oldToNew ? 0 : Number.MAX_SAFE_INTEGER) ? 0 : direction);
	}

	const tagsSet = new Set(tags);
	if (thoughtIdsToParse.length) {
		while (true && thoughtIdsToParse[i]) {
			const thought = Thought.parse(thoughtIdsToParse[i]);
			// if (freeForm)
			// roots.push(thought);
			// 	latestCreateDate = oldToNew
			// 		? Math.min(latestCreateDate, thought.createDate)
			// 		: Math.max(latestCreateDate, thought.createDate);
			const thoughtToAdd = freeForm ? thought.rootThought : thought;
			if (
				!ignoreRootIds.find((id) => id === thoughtToAdd.id) &&
				!roots.find((root) => root.id === thoughtToAdd.id) &&
				(!tags.length || !!thought.tags.find((t) => tagsSet.has(t))) &&
				(!other?.length ||
					-1 !==
						other.findIndex((term) => {
							let str: string;
							if (Array.isArray(thought.content)) {
								str = thought.content.join('');
							} else if (isRecord(thought.content)) {
								str = Object.values(thought.content).join(' ');
							} else str = thought.content as string;
							return str.toLowerCase().includes(term);
						}))
				// https://www.fusejs.io/api/options.html
				// Maybe use this idk
			) {
				if (freeForm) {
					const expansion = thoughtToAdd.expand();
					expansion.allMentionedIds.forEach((id) => mentionedIds.add(id));
					expansion.allAuthorIds.forEach((id) => authorIds.add(id));
				}
				roots.push(thoughtToAdd);
				latestCreateDate = oldToNew
					? Math.max(latestCreateDate, thought.createDate)
					: Math.min(latestCreateDate, thought.createDate);
			}
			i += direction;
			const rootsPerLoad = freeForm ? 8 : 40;
			if (roots.length === rootsPerLoad || (oldToNew ? i === index.allThoughtIds.length : i < 0)) {
				break;
			}
		}
	}

	mentionedIds.forEach((id) => (moreMentions[id] = Thought.parse(id)));
	authorIds.delete('');
	authorIds.forEach((id) => (moreDefaultNames[id] = Personas.getDefaultName(id)));
	res.send({ latestCreateDate, moreDefaultNames, moreMentions, moreRoots: roots });
};

export default getLocalThoughts;
