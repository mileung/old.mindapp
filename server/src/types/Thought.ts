import path from 'path';
import Ajv from 'ajv';
import { parseFile, touchIfDne, writeObjectFile } from '../utils/files';
import { sortUniArr } from '../utils/tags';
import { addToAllPaths, addPathsByTag } from '../utils';
import { WorkingDirectory } from './WorkingDirectory';
import { day } from '../utils/time';
import { Personas } from './Personas';
import { verifyMessage } from '../utils/security';

const ajv = new Ajv({ verbose: true });

const schema = {
	type: 'object',
	properties: {
		createDate: { type: 'number' },
		authorId: { type: 'string' },
		spaceId: { type: 'string' },
		content: {
			anyOf: [
				{ type: 'string' },
				{ type: 'array', items: { type: 'string' } },
				{
					type: 'object',
					additionalProperties: { type: 'string' },
				},
			],
		},
		tags: { type: 'array', items: { type: 'string' } },
		parentId: { type: 'string' },
		childrenIds: { type: 'array', items: { type: 'string' } },
		mentionedByIds: { type: 'array', items: { type: 'string' } },
		authorSignature: { type: 'string' },
		spaceSignature: { type: 'string' },
	},
	required: ['createDate', 'authorId', 'spaceId', 'content'],
	additionalProperties: false,
};

const thoughtIdRegex = /^\d{3,}_(|[A-HJ-NP-Za-km-z1-9]{3,})_(|[A-HJ-NP-Za-km-z1-9]{3,})$/;

export class Thought {
	public id: string;
	public filePath: string;
	public children?: Thought[];
	public createDate: number;
	public authorId: string;
	public spaceId: string;
	// Above are temporary. Below are saved on disk.
	public content: string | string[] | Record<string, string>;
	public tags: string[];
	public parentId?: string;
	public childrenIds?: string[];
	public mentionedByIds?: string[];
	public authorSignature?: string;
	public spaceSignature?: string;

	constructor(
		{
			createDate,
			authorId = '',
			authorSignature,
			spaceId = '',
			content,
			tags,
			parentId,
			childrenIds,
			mentionedByIds,
		}: {
			createDate: number;
			authorId?: string;
			authorSignature?: string;
			spaceId?: string;
			content: string | string[] | Record<string, string>;
			tags?: string[];
			// reactions: Record<string, number>; // emoji, personaId
			parentId?: string;
			childrenIds?: string[];
			mentionedByIds?: string[];
		},
		write?: boolean,
	) {
		// save these props on disk
		this.createDate = createDate;
		this.authorId = authorId;
		this.authorSignature = authorSignature;
		this.spaceId = spaceId;
		if (Array.isArray(content)) {
			const lastI = content.length - 1;
			content = content.map((segment, i) => {
				if (i % 2) {
					// TODO: validate other segments like file paths and update `get mentionedIds`
					if (!thoughtIdRegex.test(segment)) throw new Error('Invalid mentioned Id');
					return segment;
				} else {
					if (!i) return segment.trimStart();
					if (i === lastI) return segment.trimEnd();
					return segment;
				}
			});
		} else if (typeof content === 'string') content = content.trim();
		this.content = content;
		this.tags = sortUniArr((tags || []).map((t) => t.trim()));
		this.parentId = parentId;
		this.childrenIds = childrenIds;
		this.mentionedByIds = mentionedByIds;
		// Mentioning thoughts by id in the content instead of having multiple parentIds for said mentioned props prevents cyclic graph connections which would make finding root thoughts impossible.

		if (authorId) {
			if (authorSignature) {
				const valid = verifyMessage(
					JSON.stringify(this.standaloneProps),
					authorId,
					authorSignature,
				);
				if (!valid) throw new Error('Invalid authorSignature');
			} else this.signAs(authorId);
		} else if (this.authorSignature) throw new Error('authorId missing');

		// this.spaceSignature;

		if (!ajv.validate(schema, this)) throw new Error('Invalid Thought: ' + JSON.stringify(this));

		// Saving these props is not necessary
		this.id = Thought.calcId(createDate, authorId, spaceId);
		this.filePath = Thought.calcPath(createDate, authorId, spaceId);

		if (write) {
			if (parentId) {
				const parent = Thought.parse(parentId);
				parent.addChild(this.id);
				this.parentId = parentId;
			}
			addToAllPaths(this);
			this.mentionedIds.forEach((id) => Thought.parse(id).addMention(this.id));
			this.write();
			this.tags.forEach((tag) => addPathsByTag(tag, this));
		}
	}

	get savedProps() {
		return {
			content: this.content,
			tags: this.tags.length ? this.tags : undefined,
			parentId: this.parentId,
			childrenIds: this.childrenIds,
			mentionedByIds: this.mentionedByIds,
			authorSignature: this.authorSignature,
			spaceSignature: this.spaceSignature,
		};
	}

	get standaloneProps() {
		return {
			createDate: this.createDate,
			authorId: this.authorId,
			spaceId: this.spaceId,
			content: this.content,
			tags: this.tags,
			parentId: this.parentId,
		};
	}

	get rootThought(): Thought {
		return !this.parentId ? this : Thought.parse(this.parentId).rootThought;
	}

	get parent(): null | Thought {
		return !this.parentId ? null : Thought.parse(this.parentId);
	}

	get mentionedIds() {
		return Array.isArray(this.content) ? this.content.filter((_, i) => !!(i % 2)) : [];
	}

	write() {
		const written = touchIfDne(this.filePath, JSON.stringify(this.savedProps));
		if (!written) {
			// TODO: the client should retry so the user doesn't have to manually trigger again
			throw new Error('Duplicate timestamp entry');
		}
	}

	overwrite() {
		writeObjectFile(this.filePath, this.savedProps);
	}

	expand() {
		const allMentionedIds = this.mentionedIds;
		const allAuthorIds = [this.authorId];
		this.children = !this.childrenIds
			? this.childrenIds
			: this.childrenIds.map((id) => {
					const child = Thought.parse(id);
					const expansion = child.expand();
					allMentionedIds.push(...child.mentionedIds, ...expansion.allMentionedIds);
					allAuthorIds.push(...expansion.allAuthorIds);
					return child;
				});
		return { allMentionedIds, allAuthorIds: [...new Set(allAuthorIds)] };
	}

	addChild(thoughtId: string) {
		this.childrenIds = sortUniArr((this.childrenIds || []).concat(thoughtId));
		this.overwrite();
	}

	removeChild(thoughtId: string) {
		const childIndex = (this.childrenIds || []).indexOf(thoughtId);
		if (childIndex !== -1) {
			this.childrenIds!.splice(childIndex, 1);
			!this.childrenIds?.length && delete this.childrenIds;
			this.overwrite();
		}
	}

	addMention(thoughtId: string) {
		this.mentionedByIds = this.mentionedByIds || [];
		this.mentionedByIds = sortUniArr(this.mentionedByIds.concat(thoughtId));
		this.overwrite();
	}

	removeMention(thoughtId: string) {
		const thoughtIdIndex = (this.mentionedByIds || []).indexOf(thoughtId);
		if (thoughtIdIndex !== -1) {
			this.mentionedByIds!.splice(thoughtIdIndex, 1);
			!this.mentionedByIds?.length && delete this.mentionedByIds;
			this.overwrite();
		}
	}

	signAs(personaId: string) {
		this.authorSignature = Personas.get().signMessageAs(
			JSON.stringify(this.standaloneProps),
			personaId,
		);
		this.authorId = personaId;
	}

	static parse(thoughtId: string) {
		const [createDate, authorId, spaceId] = thoughtId.split('_');
		const filePath = Thought.calcPath(+createDate, authorId, spaceId);
		return Thought.read(filePath);
	}

	static read(filePath: string) {
		const [createDate, authorId, spaceId] = path
			.basename(filePath.slice(0, filePath.length - 5))
			.split('_');
		return new Thought({
			...parseFile<Thought>(filePath),
			createDate: +createDate,
			authorId,
			spaceId,
		});
	}

	static calcId(createDate: number, authorId: string, spaceId: string) {
		return `${createDate}_${authorId}_${spaceId}`;
	}

	static calcPath(createDate: number, authorId: string, spaceId: string) {
		const daysSince1970 = +createDate / day;
		return path.join(
			WorkingDirectory.current.timelinePath,
			Math.floor(daysSince1970 / 10000) * 10000 + '', // 27.38 years
			Math.floor(daysSince1970 / 1000) * 1000 + '',
			Math.floor(daysSince1970 / 100) * 100 + '',
			Math.floor(daysSince1970 / 10) * 10 + '',
			Math.floor(daysSince1970) + '',
			`${Thought.calcId(createDate, authorId, spaceId)}.json`,
		);
	}
}
