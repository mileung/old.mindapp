import Ajv from 'ajv';
import path from 'path';
import { parseFile, timelinePath, touchIfDne, writeFile } from '../utils/files';
import { day } from '../utils/time';
import { makeSortedUniqueArr } from '../utils/tags';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		createDate: { type: 'number' },
		authorId: { type: ['null', 'number'] },
		spaceId: { type: ['null', 'number'] },
		content: { type: 'string' },
		tags: { type: 'array', items: { type: 'string' } },
		parentId: { type: 'string' },
		childrenIds: { type: 'array', items: { type: 'string' } },
	},
	required: ['createDate', 'authorId', 'spaceId', 'content'],
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
	public content: string;
	public tags?: string[];
	public parentId?: string;
	public childrenIds?: string[] = [];

	constructor(
		{
			createDate,
			authorId,
			spaceId,
			content,
			tags,
			parentId,
			childrenIds,
		}: {
			createDate: number;
			authorId: null | number;
			spaceId: null | number;
			content: string;
			tags?: string[];
			parentId?: string;
			childrenIds?: string[];
		},
		write?: boolean,
		overwrite?: boolean,
	) {
		// save these props on disk
		this.createDate = createDate;
		this.authorId = authorId;
		this.spaceId = spaceId;
		this.content = content;
		this.tags = !tags ? tags : makeSortedUniqueArr(tags);
		this.parentId = parentId;
		this.childrenIds = childrenIds;

		// console.log("this:", this);
		if (!ajv.validate(schema, this)) throw new Error('Invalid Thought: ' + JSON.stringify(this));

		// Saving these props is not necessary
		this.id = createDate + '.' + authorId + '.' + spaceId;
		this.filePath = Thought.calcFilePath(createDate, authorId, spaceId);

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
			} else if (overwrite) {
				this.overwrite();
			} else {
				this.write();
			}
		}
	}

	get criticalProps() {
		return {
			createDate: this.createDate,
			authorId: this.authorId,
			spaceId: this.spaceId,
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
		this.children = !this.childrenIds
			? this.childrenIds
			: this.childrenIds.map((id) => {
					const child = Thought.parse(id);
					child.expand();
					return child;
				});
	}

	static calcFilePath(createDate: number, authorId: null | number, spaceId: null | number) {
		const daysSince1970 = +createDate / day;
		const period = Math.floor(daysSince1970 / 100) * 100 + '';

		return path.join(
			timelinePath,
			period,
			Math.floor(daysSince1970) + '',
			`${createDate}.${authorId}.${spaceId}.json`,
		);
	}

	static parse(thoughtId: string) {
		const [createDate, authorId, spaceId] = thoughtId.split('.');
		return Thought.read(this.calcFilePath(+createDate, +authorId || null, +spaceId || null));
	}

	static read(filePath: string) {
		const o = parseFile<Thought>(filePath);
		return new Thought({
			createDate: o.createDate,
			authorId: o.authorId,
			spaceId: o.spaceId,
			content: o.content,
			tags: o.tags,
			parentId: o.parentId,
			childrenIds: o.childrenIds,
		});
	}
}
