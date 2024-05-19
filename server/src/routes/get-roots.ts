import { and, asc, desc, eq, gte, like, lte, or } from 'drizzle-orm';
import { RequestHandler } from 'express';
import { drizzleClient, inGroup } from '../db';
import { thoughtsTable } from '../db/schema';
import { Personas } from '../types/Personas';
import { Thought } from '../types/Thought';
import env from '../utils/env';
import { Author } from '../types/Author';

type ResultsQuery = {
	thoughtId?: string;
	authorId?: string;
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
				authorId,
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
	const mentionedThoughIds = new Set<string>();
	const authorIds = new Set<string>();
	const mentionedThoughts: Record<string, Thought> = {};
	const authors: Record<string, Author['clientProps']> = {};
	let latestCreateDate = oldToNew ? 0 : Number.MAX_SAFE_INTEGER;
	const rootsPerLoad = freeForm ? 8 : 40;

	if (thoughtId) {
		const thought = await Thought.query(thoughtId);
		if (!thought) return res.send({ mentionedThoughts: {}, moreRoots: [] });

		const rootThought = await thought.getRootThought();
		const { clientProps, allMentionedIds, allAuthorIds } = await rootThought.expand(from);
		allMentionedIds.forEach((id) => mentionedThoughIds.add(id));
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
					authorId ? eq(thoughtsTable.authorId, authorId) : undefined,
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
				const { clientProps, allMentionedIds, allAuthorIds } = await rootThought.expand(from);
				allMentionedIds.forEach((id) => mentionedThoughIds.add(id));
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

	await Promise.all(
		[...mentionedThoughIds].map((id) => {
			return Thought.query(id).then((thought) => {
				if (thought) {
					mentionedThoughts[id] = thought;
					authorIds.add(mentionedThoughts[id].authorId);
				}
			});
		}),
	);

	authorIds.delete('');
	await Promise.all(
		[...authorIds].map((id) => {
			if (id) return Personas.getAuthor(id).then((a) => a && (authors[id] = a));
		}),
	);
	res.send({ latestCreateDate, authors, mentionedThoughts, roots });
	console.timeEnd('query time');
};

export default getRoots;
