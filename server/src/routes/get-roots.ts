import { and, asc, desc, gte, like, lte, or } from 'drizzle-orm';
import { RequestHandler } from 'express';
import { drizzleClient, inGroup } from '../db';
import { thoughtsTable } from '../db/schema';
import { Personas } from '../types/Personas';
import { Thought } from '../types/Thought';
import env from '../utils/env';

export type ResultsQuery = {
	thoughtId?: string;
	tags?: string[];
	other?: string[];
	freeForm: boolean;
	oldToNew: boolean;
	ignoreRootIds: string[];
	thoughtsBeyond: number;
};

const getRoots: RequestHandler = async (req, res) => {
	console.time('query time');
	const {
		message: {
			from,
			query: {
				thoughtId,
				tags = [],
				other = [],
				freeForm,
				oldToNew,
				ignoreRootIds,
				thoughtsBeyond,
			},
		},
	} = req.body as { message: { from: string; query: ResultsQuery } };

	const fromExistingMember = await inGroup(from);
	if (env.GLOBAL_HOST && !env.ANYONE_CAN_JOIN && !fromExistingMember) {
		throw new Error('Access denied');
	}
	if (fromExistingMember?.frozen) throw new Error('Frozen persona');

	const excludeIds = new Set(ignoreRootIds);
	const roots: Thought['clientProps'][] = [];
	const mentionedIds = new Set<string>();
	const authorIds = new Set<string>();
	const moreMentions: Record<string, Thought> = {};
	const moreDefaultNames: Record<string, string> = {};
	let latestCreateDate = oldToNew ? 0 : Number.MAX_SAFE_INTEGER;
	const rootsPerLoad = freeForm ? 8 : 40;

	if (thoughtId) {
		const thought = await Thought.query(thoughtId);
		if (!thought) return res.send({ moreMentions: {}, moreRoots: [] });

		const rootThought = await thought.getRootThought();
		const { clientProps, allMentionedIds, allAuthorIds } = await rootThought.expand();
		allMentionedIds.forEach((id) => mentionedIds.add(id));
		allAuthorIds.forEach((id) => authorIds.add(id));
		roots.push(clientProps);
	}

	let offset = 0;
	while (true) {
		const [currentRow] = await drizzleClient
			.select()
			.from(thoughtsTable)
			.where(
				and(
					thoughtId
						? like(thoughtsTable.content, `%${thoughtId}%`)
						: or(
								...tags.map((tag) => like(thoughtsTable.tags, `%"${tag}"%`)),
								...other.map((term) => like(thoughtsTable.content, `%${term}%`)),
							),

					(oldToNew ? gte : lte)(thoughtsTable.createDate, thoughtsBeyond),
				),
			)
			.orderBy((oldToNew ? asc : desc)(thoughtsTable.createDate))
			.limit(1)
			.offset(offset++);

		if (!currentRow) break;
		if (freeForm) {
			const rootThought = await new Thought(currentRow).getRootThought();
			if (
				!excludeIds.has(rootThought.id) &&
				!roots.find((root) => new Thought(root).id === rootThought.id)
			) {
				const { clientProps, allMentionedIds, allAuthorIds } = await rootThought.expand();
				allMentionedIds.forEach((id) => mentionedIds.add(id));
				allAuthorIds.forEach((id) => authorIds.add(id));
				roots.push(clientProps);
			}
		} else {
			const thought = new Thought(currentRow);
			if (!excludeIds.has(thought.id)) roots.push(thought.clientProps);
		}
		latestCreateDate = (oldToNew ? Math.max : Math.min)(latestCreateDate, currentRow.createDate);
		if (roots.length === rootsPerLoad) {
			break;
		}
	}

	const mentionedIdsArr = [...mentionedIds];
	for (let i = 0; i < mentionedIdsArr.length; i++) {
		const id = mentionedIdsArr[i];
		const mentionedThought = await Thought.query(id);
		if (mentionedThought) moreMentions[id] = mentionedThought;
	}

	authorIds.delete('');
	await Promise.all(
		[...authorIds].map((id) =>
			Personas.getDefaultName(id).then((name) => {
				name && (moreDefaultNames[id] = name);
			}),
		),
	);
	res.send({ latestCreateDate, moreDefaultNames, moreMentions, moreRoots: roots });
	console.timeEnd('query time');
};

export default getRoots;
