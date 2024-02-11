import Ajv from 'ajv';
import path from 'path';
import { parseFile, timelinePath, touchIfDne, writeFile } from '../utils/files';
import { day } from '../utils/time';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		spaceId: { type: ['null', 'number'] },
		createDate: { type: 'number' },
		authorId: { type: ['null', 'number'] },
		content: { type: 'string' },
		tags: { type: 'array', items: { type: 'string' } },
		parentId: { type: 'string' },
		childrenIds: { type: 'array', items: { type: 'string' } },
	},
	required: ['spaceId', 'createDate', 'authorId', 'content'],
	additionalProperties: false,
};

export class Thought {
	public id: string;
	public filePath: string;
	public parent?: Thought;
	public children?: Thought[];

	constructor(
		public spaceId: null | number,
		public createDate: number,
		public authorId: null | number,
		public content: string,
		public tags?: string[],
		public parentId?: string,
		public childrenIds: string[] = [],
		write = false
	) {
		// save these props on disk
		this.spaceId = spaceId;
		this.createDate = createDate;
		this.authorId = authorId;
		this.content = content;
		this.tags = !tags ? tags : tags.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
		this.parentId = parentId;
		this.childrenIds = childrenIds;

		// console.log("this:", this);
		if (!ajv.validate(schema, this)) throw new Error('Invalid Thought: ' + JSON.stringify(this));

		// Saving these props is not necessary
		this.id = spaceId + '.' + createDate + '.' + authorId;
		this.filePath = Thought.calcFilePath(spaceId, createDate, authorId);

		if (write) {
			if (parentId) {
				// ensure parent exists
				const parent = Thought.parse(parentId);
				parent.childrenIds = parent.childrenIds || [];
				parent.childrenIds.push(this.id);

				this.parentId = parentId;
				// Throws if filePath exists
				this.write();

				// overwrite parent when if it exists and child was written
				parent.overwrite();
			} else {
				this.write();
			}
		}
	}

	get criticalProps() {
		return {
			spaceId: this.spaceId,
			createDate: this.createDate,
			authorId: this.authorId,
			content: this.content,
			tags: this.tags,
			parentId: this.parentId,
			childrenIds: this.childrenIds,
		};
	}

	getRootThought(): Thought {
		if (!this.parentId) return this;
		return Thought.parse(this.parentId).getRootThought();
	}

	private write() {
		const written = touchIfDne(this.filePath, JSON.stringify(this.criticalProps));
		if (!written) {
			// TODO: the client should retry so the user doesn't have to manually trigger again
			throw new Error('Duplicate timestamp entry');
		}
	}

	private overwrite() {
		return writeFile(this.filePath, JSON.stringify(this.criticalProps));
	}

	expand() {
		this.children = this.childrenIds.map((id) => {
			const child = Thought.parse(id);
			child.expand();
			return child;
		});
	}

	static calcFilePath(spaceId: null | number, createDate: number, authorId: null | number) {
		const daysSince1970 = +createDate / day;
		const period = Math.floor(daysSince1970 / 100) * 100 + '';

		return path.join(
			timelinePath,
			period,
			Math.floor(daysSince1970) + '',
			`${spaceId}.${createDate}.${authorId}.json`
		);
	}

	static parse(thoughtId: string) {
		const [spaceId, createDate, authorId] = thoughtId.split('.');
		return Thought.read(this.calcFilePath(+spaceId || null, +createDate, +authorId || null));
	}

	static read(filePath: string) {
		const o = parseFile<Thought>(filePath);
		return new Thought(
			o.spaceId,
			o.createDate,
			o.authorId,
			o.content,
			o.tags,
			o.parentId,
			o.childrenIds
		);
	}
}
