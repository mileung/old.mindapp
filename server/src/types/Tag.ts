import Ajv from 'ajv';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		label: { type: 'string' },
		parentTags: { type: 'array', items: { type: 'string' } },
		subTags: { type: 'array', items: { type: 'string' } },
	},
	required: ['label', 'parentTags', 'subTags'],
	additionalProperties: false,
};

export class Tag {
	constructor(
		public label: string,
		public parentTags: string[] = [],
		public subTags: string[] = []
	) {
		this.label = label;
		this.parentTags = parentTags;
		this.subTags = subTags;

		// console.log('this:', this);
		if (!ajv.validate(schema, this)) throw new Error('Invalid Tag: ' + JSON.stringify(this));
	}
}
