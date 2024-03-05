import path from 'path';
import Ajv from 'ajv';
import { calcFilePath, parseFile, touchIfDne, writeObjectFile } from '../utils/files';
import { addTagIndex, sortUniArr } from '../utils/tags';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		createDate: { type: 'number' },
		authorId: { type: ['null', 'number'] },
		spaceId: { type: ['null', 'number'] },
		content: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
		tags: { type: 'array', items: { type: 'string' } },
		parentId: { type: 'string' },
		childrenIds: { type: 'array', items: { type: 'string' } },
		mentionedByIds: { type: 'array', items: { type: 'string' } },
	},
	required: ['createDate', 'authorId', 'spaceId', 'content', 'tags'],
	additionalProperties: false,
};

export class Thought {
	public id: string;
	public filePath: string;
	public children?: Thought[];
	public createDate: number;
	public authorId: null | number;
	public spaceId: null | number;
	// Above are temporary. Below are saved on disk.
	public content: string | string[];
	public tags: string[];
	public parentId?: string;
	public childrenIds?: string[];
	public mentionedByIds?: string[];

	constructor(
		{
			createDate,
			authorId,
			spaceId,
			content,
			tags,
			parentId,
			childrenIds,
			mentionedByIds,
		}: {
			createDate: number;
			authorId: null | number;
			spaceId: null | number;
			content: string | string[];
			tags?: string[];
			// reactions: Record<string, number>; // emoji, personaId
			parentId?: string;
			// isDeletedParent?: boolean;
			childrenIds?: string[];
			mentionedByIds?: string[];
		},
		write?: boolean,
	) {
		// save these props on disk
		this.createDate = createDate;
		this.authorId = authorId;
		this.spaceId = spaceId;
		this.content = content;
		this.tags = sortUniArr(tags || []);
		this.parentId = parentId;
		this.childrenIds = childrenIds;
		this.mentionedByIds = mentionedByIds;
		// Mentioning thoughts by id in the content allows instead of having multiple parentIds prevents cyclic graph connections which would make finding root thoughts impossible.

		// console.log('this:', this);
		if (!ajv.validate(schema, this)) throw new Error('Invalid Thought: ' + JSON.stringify(this));

		// Saving these props is not necessary
		this.id = createDate + '.' + authorId + '.' + spaceId;
		this.filePath = calcFilePath(createDate, authorId, spaceId);

		if (write) {
			if (parentId) {
				const parent = Thought.parse(parentId);
				parent.addChild(this.id);
				this.parentId = parentId;
			}

			this.tags.forEach((tag) => addTagIndex(tag, this.id));
			Array.isArray(this.content) &&
				this.content.forEach((id, i) => {
					if (i % 2) {
						// TODO: ensure id is of a thought, not a file
						Thought.parse(id).addMention(this.id);
					}
				});

			this.write();
		}
	}

	get criticalProps() {
		return {
			content: this.content,
			tags: this.tags,
			parentId: this.parentId,
			childrenIds: this.childrenIds,
			mentionedByIds: this.mentionedByIds,
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
		const written = touchIfDne(this.filePath, JSON.stringify(this.criticalProps));
		if (!written) {
			// TODO: the client should retry so the user doesn't have to manually trigger again
			throw new Error('Duplicate timestamp entry');
		}
	}

	overwrite() {
		writeObjectFile(this.filePath, this.criticalProps);
	}

	expand() {
		const allMentionedIds = this.mentionedIds;
		this.children = !this.childrenIds
			? this.childrenIds
			: this.childrenIds.map((id) => {
					const child = Thought.parse(id);
					allMentionedIds.push(...child.mentionedIds, ...child.expand());
					return child;
				});
		return allMentionedIds;
	}

	addChild(thoughtId: string) {
		this.childrenIds = this.childrenIds || [];
		this.childrenIds = sortUniArr(this.childrenIds.concat(thoughtId));
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

	static parse(thoughtId: string) {
		const [createDate, authorId, spaceId] = thoughtId.split('.');
		return Thought.read(calcFilePath(+createDate, +authorId || null, +spaceId || null));
	}

	static read(filePath: string) {
		const [createDate, authorId, spaceId] = path.basename(filePath).split('.');
		return new Thought({
			...parseFile<Thought>(filePath),
			createDate: +createDate,
			authorId: +authorId || null,
			spaceId: +spaceId || null,
		});
	}
}
