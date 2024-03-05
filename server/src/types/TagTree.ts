import Ajv from 'ajv';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		branchNodes: {
			type: 'object',
			patternProperties: {
				'.+': { type: 'array', items: { type: 'string' } },
			},
		},
		leafNodes: { type: 'array', items: { type: 'string' } },
	},
	required: ['leafNodes'],
	additionalProperties: false,
};

export default class TagTree {
	public branchNodes: Record<string, string[]>;
	public leafNodes: string[];

	constructor({
		branchNodes,
		leafNodes,
	}: {
		branchNodes: Record<string, string[]>;
		leafNodes: string[];
	}) {
		this.branchNodes = branchNodes;
		this.leafNodes = leafNodes;

		// console.log('this:', this);
		if (!ajv.validate(schema, this)) throw new Error('Invalid TagTree: ' + JSON.stringify(this));
	}
}
