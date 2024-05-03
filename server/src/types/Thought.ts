import path from 'path';
import Ajv from 'ajv';
import { isFile, parseFile, touchIfDne, writeObjectFile } from '../utils/files';
import { sortUniArr } from '../utils/tags';
import { WorkingDirectory } from './WorkingDirectory';
import { day } from '../utils/time';
import { Personas } from './Personas';
import { verifyItem } from '../utils/security';
import { drizzleClient } from '../db';
import { thoughtsTable } from '../db/schema';
import { and, desc, eq, isNull, like, or } from 'drizzle-orm';
import env from '../utils/env';
import { localApiHost } from '../utils/api';

const ajv = new Ajv({ verbose: true });

const schema = {
	type: 'object',
	properties: {
		createDate: { type: 'number' },
		authorId: { type: 'string' },
		spaceHost: { type: 'string' },
		content: { type: 'string' },
		tags: { type: 'array', items: { type: 'string' } },
		parentId: { type: 'string' },
		signature: { type: 'string' },
	},
	required: ['createDate', 'authorId', 'spaceHost', 'content'],
	additionalProperties: false,
};

const thoughtIdsRegex = /\b\d{9,}_(|[A-HJ-NP-Za-km-z1-9]{9,})_(|[\w:\.-]{3,})\b/g;

export class Thought {
	public createDate: number;
	public authorId: string;
	public spaceHost: string;
	public content: string;
	public tags: string[];
	public parentId: string;
	public signature: string;
	public children?: Thought[];

	constructor(
		{
			createDate,
			authorId,
			spaceHost,
			content,
			tags,
			parentId,
			signature,
		}: {
			createDate: number;
			authorId?: null | string;
			spaceHost?: null | string;
			content?: null | string;
			tags?: null | string[];
			parentId?: null | string;
			signature?: null | string;
		},
		write?: boolean,
	) {
		// save these props on disk
		this.createDate = createDate;
		this.authorId = authorId || '';
		this.spaceHost = spaceHost || '';
		this.content = (content || '').trim();
		this.tags = sortUniArr((tags || []).map((t) => t.trim()));
		this.parentId = parentId || '';
		this.signature = signature || '';

		if (!ajv.validate(schema, this)) throw new Error('Invalid Thought: ' + JSON.stringify(this));

		this.verifySignature();
		if (write) this.write();
	}

	get signedProps() {
		return {
			createDate: this.createDate,
			authorId: this.authorId || undefined,
			spaceHost: this.spaceHost || undefined,
			content: this.content || undefined,
			tags: this.tags.length ? this.tags : undefined,
			parentId: this.parentId || undefined,
		};
	}

	get dbColumns() {
		return {
			createDate: this.createDate,
			authorId: this.authorId || null,
			spaceHost: this.spaceHost || null,
			content: this.content || null,
			tags: this.tags.length ? this.tags : null,
			parentId: this.parentId || null,
			signature: this.signature || null,
		};
	}

	get savedProps() {
		return {
			content: this.content || undefined,
			tags: this.tags.length ? this.tags : undefined,
			parentId: this.parentId || undefined,
			signature: this.signature || undefined,
		};
	}

	get clientProps(): {
		createDate: number;
		authorId?: string;
		signature?: string;
		spaceHost?: string;
		content?: string;
		tags?: string[];
		parentId?: string;
		children?: Thought['clientProps'][];
		filedSaved?: true;
	} {
		return {
			createDate: this.createDate,
			authorId: this.authorId || undefined,
			signature: this.signature || undefined,
			spaceHost: this.spaceHost || undefined,
			content: this.content || undefined,
			tags: this.tags.length ? this.tags : undefined,
			parentId: this.parentId || undefined,
			children: this.children?.length ? this.children.map((c) => c.clientProps) : undefined,
			filedSaved: env.IS_GLOBAL_SPACE ? undefined : isFile(this.filePath) || undefined,
		} as const;
	}

	async getRootThought(): Promise<Thought> {
		if (!this.parentId) return this;
		const parentThought = await Thought.query(this.parentId);
		if (!parentThought) throw new Error('Parent thought does not exist');
		return parentThought.getRootThought();
	}

	get mentionedIds() {
		return [...` ${this.content} `.matchAll(thoughtIdsRegex)].map((match) => match[0]);
	}

	get id() {
		return Thought.calcId(this.createDate, this.authorId, this.spaceHost);
	}

	get filePath() {
		return Thought.calcFilePath(this.createDate, this.authorId, this.spaceHost);
	}

	get reactions() {
		// reactions: Record<string, number>; // emoji, personaId
		return {};
	}

	async expand() {
		const allMentionedIds = [...this.mentionedIds];
		const allAuthorIds = [this.authorId];
		this.children = await Promise.all(
			(
				await drizzleClient
					.select()
					.from(thoughtsTable)
					.where(eq(thoughtsTable.parentId, this.id))
					.orderBy(desc(thoughtsTable.createDate))
			) // TODO: make asc an option
				// .orderBy((oldToNew ? asc : desc)(thoughtsTable.createDate))
				// .limit(8)
				// .offset(0)
				.map(async (row) => {
					const child = new Thought(row);
					const expansion = await child.expand();
					allMentionedIds.push(...child.mentionedIds, ...expansion.allMentionedIds);
					allAuthorIds.push(...expansion.allAuthorIds);
					return child;
				}),
		);
		return {
			clientProps: this.clientProps,
			allMentionedIds,
			allAuthorIds: [...new Set(allAuthorIds)],
		};
	}

	signAsAuthor() {
		this.signature = this.authorId
			? Personas.get().getSignature(this.signedProps, this.authorId)
			: '';
	}

	verifySignature() {
		if (this.authorId) {
			if (this.content) {
				if (this.signature) {
					const valid = verifyItem(this.signedProps, this.authorId, this.signature);
					if (!valid) {
						// this.signAsAuthor();
						// this.overwrite();
						throw new Error('Invalid signature');
					}
				} else {
					// this.signAsAuthor();
					// this.overwrite();
					throw new Error('signature missing');
				}
			} else if (this.signature) {
				console.log('Unnecessary signature', this);
			}
		}
	}

	async hasUserInteraction() {
		// TODO: check for reactions
		const [childOrMention] = await drizzleClient
			.select()
			.from(thoughtsTable)
			.where(
				or(
					//
					eq(thoughtsTable.parentId, this.id),
					like(thoughtsTable.content, `%${this.id}%`),
				),
			)
			.limit(1);
		return !!childOrMention;
	}

	async write() {
		if (!env.IS_GLOBAL_SPACE) {
			const successfulTouch = touchIfDne(this.filePath, JSON.stringify(this.savedProps));
			if (!successfulTouch) throw new Error('filePath taken');
		}
		const existingThought = await Thought.query(this.id);
		if (existingThought) throw new Error('thoughtId taken');
		return this.addToDb();
	}

	async overwrite() {
		!env.IS_GLOBAL_SPACE && writeObjectFile(this.filePath, this.savedProps);
		return await drizzleClient
			.update(thoughtsTable)
			.set(this.dbColumns)
			.where(Thought.parseIdFilter(this.id));
	}

	async addToDb() {
		return await drizzleClient // QUESTION: Why does removing async and await make this not work?
			.insert(thoughtsTable)
			.values(this.dbColumns);
	}

	async removeFromDb() {
		const res = await drizzleClient // same here
			.delete(thoughtsTable)
			.where(Thought.parseIdFilter(this.id));
		// console.log('this.id:', this.id);
		// console.log('res:', res);
		return res;
	}

	static async query(thoughtId: string) {
		const [createDate, authorId, spaceHost] = thoughtId.split('_', 3);
		// if (authorId) {
		// 	console.log('createDate, authorId, spaceHost:', createDate, authorId, spaceHost);
		// }
		const [row] = await drizzleClient
			.select()
			.from(thoughtsTable)
			.where(Thought.makeIdFilter(+createDate, authorId, spaceHost))
			.limit(1);
		return row ? new Thought(row) : null;
	}

	static parseIdFilter(id: string) {
		const [createDate, authorId, spaceHost] = id.split('_', 3);
		return Thought.makeIdFilter(+createDate, authorId, spaceHost);
	}

	static makeIdFilter(createDate: number, authorId: string, spaceHost: string) {
		return and(
			eq(thoughtsTable.createDate, +createDate),
			authorId //
				? eq(thoughtsTable.authorId, authorId)
				: isNull(thoughtsTable.authorId),
			spaceHost //
				? eq(thoughtsTable.spaceHost, spaceHost)
				: isNull(thoughtsTable.spaceHost),
		);
	}

	static read(filePath: string) {
		const fileName = path.basename(filePath, path.extname(filePath));
		const [createDate, authorId, spaceHost] = parseSafeFilename(fileName).split('_');
		return new Thought({
			...parseFile<Thought>(filePath),
			createDate: +createDate,
			authorId,
			spaceHost,
		});
	}

	static calcId(createDate: number, authorId = '', spaceHost = '') {
		spaceHost = spaceHost === localApiHost ? '' : spaceHost;
		return `${createDate}_${authorId}_${spaceHost}`;
	}

	static calcFilePath(createDate: number, authorId: string, spaceHost: string) {
		const daysSince1970 = +createDate / day;
		return path.join(
			WorkingDirectory.current.timelinePath,
			Math.floor(daysSince1970 / 10000) * 10000 + '', // 27.38 years
			Math.floor(daysSince1970 / 1000) * 1000 + '',
			Math.floor(daysSince1970 / 100) * 100 + '',
			Math.floor(daysSince1970 / 10) * 10 + '',
			Math.floor(daysSince1970) + '',
			`${makeSafeFilename(Thought.calcId(createDate, authorId, spaceHost))}.json`,
		);
	}
}

function makeSafeFilename(name: string) {
	return name //
		.replace('.', '_dot_')
		.replace(':', '_colon_');
}

function parseSafeFilename(name: string) {
	return name //
		.replace('_dot_', '.')
		.replace('_colon_', ':');
}
