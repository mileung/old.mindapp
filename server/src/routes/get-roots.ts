import { RequestHandler } from 'express';
import { Thought } from '../types/Thought';
import { closestIndexInAllPaths, index } from '../utils';

const rootsPerLoad = 8;
const getLocalThoughts: RequestHandler = (req, res) => {
	const {
		thoughtId,
		tags = [],
		other,
		oldToNew,
		ignoreRootIds,
		thoughtsBeyond,
	} = req.body as {
		thoughtId?: string;
		tags?: string[];
		other?: string[];
		oldToNew: boolean;
		ignoreRootIds: string[];
		thoughtsBeyond: number;
	};
	const roots: Thought[] = [];
	const mentionedIds = new Set<string>();
	const moreMentions: Record<string, Thought> = {};
	let latestCreateDate = oldToNew ? Number.MAX_SAFE_INTEGER : 0;

	let thoughtIds: undefined | string[];
	let direction: number;
	let i: number;
	if (thoughtId) {
		direction = 1;
		i = 0;
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
	} else {
		direction = oldToNew ? 1 : -1;
		i =
			closestIndexInAllPaths(thoughtsBeyond) +
			(thoughtsBeyond === (oldToNew ? 0 : Number.MAX_SAFE_INTEGER) ? 0 : direction);
	}

	const tagsSet = new Set(tags);
	while (true) {
		const thought = thoughtIds
			? Thought.parse(thoughtIds[i])
			: Thought.read(index.allThoughtPaths[i]);
		const { rootThought } = thought;

		if (
			!ignoreRootIds.find((id) => id === rootThought.id) &&
			!roots.find((root) => root.id === rootThought.id) &&
			(!tags.length || !!thought.tags.find((t) => tagsSet.has(t))) &&
			(!other?.length ||
				-1 !==
					other.findIndex((term) =>
						(Array.isArray(thought.content) ? thought.content.join('') : thought.content)
							.toLowerCase()
							.includes(term),
					))
			// https://www.fusejs.io/api/options.html
			// Maybe use this idk
		) {
			rootThought.expand().forEach((id) => mentionedIds.add(id));
			roots.push(rootThought);
			latestCreateDate = oldToNew
				? Math.min(latestCreateDate, thought.createDate)
				: Math.max(latestCreateDate, thought.createDate);
		}
		i += direction;
		if (
			thoughtIds
				? i === thoughtIds.length
				: roots.length === rootsPerLoad || (oldToNew ? i === index.allThoughtPaths.length : i < 0)
		)
			break;
	}

	mentionedIds.forEach((id) => (moreMentions[id] = Thought.parse(id)));
	res.send({ latestCreateDate, moreMentions, moreRoots: roots });
};

export default getLocalThoughts;
