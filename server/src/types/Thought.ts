import Ajv from 'ajv';
import { calcFilePath, parseFile, touchIfDne, writeFile } from '../utils/files';
import { addTagIndex, makeSortedUniqueArr } from '../utils/tags';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		createDate: { type: 'number' },
		authorId: { type: ['null', 'number'] },
		spaceId: { type: ['null', 'number'] },
		content: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
		tagLabels: { type: 'array', items: { type: 'string' } },
		parentId: { type: 'string' },
		childrenIds: { type: 'array', items: { type: 'string' } },
		mentionedByIds: { type: 'array', items: { type: 'string' } },
	},
	required: ['createDate', 'authorId', 'spaceId', 'content', 'tagLabels'],
	additionalProperties: false,
};

export class Thought {
	public id: string;
	public filePath: string;
	public parent?: Thought;
	public children?: Thought[];
	// Above are temporary. Below are saved on disk.
	public createDate: number;
	public authorId: null | number;
	public spaceId: null | number;
	public content: string | string[];
	public tagLabels: string[];
	public parentId?: string;
	public childrenIds?: string[];
	public mentionedByIds?: string[];

	constructor(
		{
			createDate,
			authorId,
			spaceId,
			content,
			tagLabels,
			parentId,
			childrenIds,
			mentionedByIds,
		}: {
			createDate: number;
			authorId: null | number;
			spaceId: null | number;
			content: string | string[];
			tagLabels?: string[];
			parentId?: string;
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
		this.tagLabels = makeSortedUniqueArr(tagLabels || []);
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

			this.tagLabels.forEach((label) => addTagIndex(label, this.id));
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
			createDate: this.createDate,
			authorId: this.authorId,
			spaceId: this.spaceId,
			content: this.content,
			tagLabels: this.tagLabels,
			parentId: this.parentId,
			childrenIds: this.childrenIds,
			mentionedByIds: this.mentionedByIds,
		};
	}

	get rootThought(): Thought {
		return !this.parentId ? this : Thought.parse(this.parentId).rootThought;
	}

	write() {
		const written = touchIfDne(this.filePath, JSON.stringify(this.criticalProps));
		if (!written) {
			// TODO: the client should retry so the user doesn't have to manually trigger again
			throw new Error('Duplicate timestamp entry');
		}
	}

	overwrite() {
		return writeFile(this.filePath, JSON.stringify(this.criticalProps));
	}

	expand() {
		const allMentionedIds = Thought.getMentionedIds(this.content);
		this.children = !this.childrenIds
			? this.childrenIds
			: this.childrenIds.map((id) => {
					const child = Thought.parse(id);
					allMentionedIds.push(...Thought.getMentionedIds(child.content), ...child.expand());
					return child;
				});
		return allMentionedIds;
	}

	addChild(thoughtId: string) {
		this.childrenIds = this.childrenIds || [];
		this.childrenIds = makeSortedUniqueArr(this.childrenIds.concat(thoughtId));
		this.overwrite();
	}

	addMention(thoughtId: string) {
		this.mentionedByIds = this.mentionedByIds || [];
		this.mentionedByIds = makeSortedUniqueArr(this.mentionedByIds.concat(thoughtId));
		this.overwrite();
	}

	removeMention(thoughtId: string) {
		if (this.mentionedByIds) {
			const thoughtIdIndex = this.mentionedByIds.indexOf(thoughtId);
			thoughtIdIndex !== -1 && this.mentionedByIds.splice(thoughtIdIndex, 1);
			this.overwrite();
		}
	}

	static getMentionedIds(content: string | string[]) {
		return Array.isArray(content) ? content.filter((_, i) => !!(i % 2)) : [];
	}

	static parse(thoughtId: string) {
		const [createDate, authorId, spaceId] = thoughtId.split('.');
		return Thought.read(calcFilePath(+createDate, +authorId || null, +spaceId || null));
	}

	static read(filePath: string) {
		return new Thought(parseFile<Thought>(filePath));
	}
}
