import Ajv from 'ajv';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		label: { type: 'string' },
		parentLabels: { type: 'array', items: { type: 'string' } },
		subLabels: { type: 'array', items: { type: 'string' } },
	},
	required: ['label', 'parentLabels', 'subLabels'],
	additionalProperties: false,
};

export class Tag {
	public label: string;
	public parentLabels: string[];
	public subLabels: string[];

	constructor({
		label,
		parentLabels = [],
		subLabels = [],
	}: {
		label: string;
		parentLabels?: string[];
		subLabels?: string[];
	}) {
		this.label = label;
		this.parentLabels = parentLabels;
		this.subLabels = subLabels;

		// console.log('this:', this);
		if (!ajv.validate(schema, this)) throw new Error('Invalid Tag: ' + JSON.stringify(this));
	}
}
