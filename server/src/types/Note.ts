import Ajv from 'ajv';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		createDate: { type: 'number' },
		authorId: { type: 'number' },
		content: { type: 'string' },
		tags: { type: 'array', items: { type: 'string' } },
		parent: { type: 'number' },
		children: { type: 'array', items: { type: 'number' } },
	},
	required: ['createDate', 'authorId', 'content'],
	additionalProperties: false,
};

export class Note {
	constructor(
		public createDate: number,
		public authorId: number,
		public content: string,
		public tags?: string[],
		public parent?: number,
		public children?: number[]
	) {
		this.createDate = createDate;
		this.authorId = authorId;
		this.content = content;
		this.tags = tags;
		this.parent = parent;
		this.children = children;

		// console.log("this:", this);
		if (!ajv.validate(schema, this)) throw new Error('Invalid Note: ' + JSON.stringify(this));
	}
}
