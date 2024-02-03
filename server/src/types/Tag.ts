import Ajv from 'ajv';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		tag: { type: 'string' },
		subsetOf: { type: 'array', items: { type: 'string' } },
		subsets: { type: 'array', items: { type: 'string' } },
	},
	required: ['tag', 'subsetOf', 'subsets'],
	additionalProperties: false,
};

export class Tag {
	constructor(
		public tag: string,
		public subsetOf: string[],
		public subsets: string[]
	) {
		this.tag = tag;
		this.subsetOf = subsetOf;
		this.subsets = subsets;

		// console.log("this:", this);
		if (!ajv.validate(schema, this)) throw new Error('Invalid Tag: ' + JSON.stringify(this));
	}
}
