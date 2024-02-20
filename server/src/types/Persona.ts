import Ajv from 'ajv';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		publicKey: { type: 'string' },
		encryptedPrivateKey: { type: 'string' },
		preferredName: { type: 'string' },
	},
	required: ['publicKey', 'encryptedPrivateKey', 'preferredName'],
	additionalProperties: false,
};

export class Persona {
	constructor(
		public publicKey: string,
		public encryptedPrivateKey: string,
		public preferredName: string,
	) {
		this.publicKey = publicKey;
		this.encryptedPrivateKey = encryptedPrivateKey;
		this.preferredName = preferredName; // other people can set a  display name on your persona that only they can see6

		// console.log("this:", this);
		if (!ajv.validate(schema, this)) throw new Error('Invalid Persona: ' + JSON.stringify(this));
	}
}
