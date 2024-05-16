import Ajv from 'ajv';
import { signItem, verifyItem } from '../utils/security';

const ajv = new Ajv({ verbose: true });

const schema = {
	type: 'object',
	properties: {
		voterId: { type: 'string' },
		up: { type: 'boolean' },
		thoughtId: { type: 'string' },
		voteDate: { type: 'number' },
		txHash: { type: 'string' },
		signature: { type: 'string' },
	},
	required: ['voterId', 'up', 'thoughtId', 'voteDate', 'txHash', 'signature'],
	additionalProperties: false,
};

export class Vote {
	public voterId: string;
	public up: boolean;
	public thoughtId: string;
	public voteDate: number;
	public txHash: string;
	public signature: string;

	constructor({
		voterId,
		up,
		thoughtId,
		voteDate,
		txHash,
		signature,
	}: {
		voterId: string;
		thoughtId: string;
		voteDate: number;
		up?: boolean | null;
		txHash?: string | null;
		signature?: string | null;
	}) {
		this.voterId = voterId;
		this.thoughtId = thoughtId;
		this.voteDate = voteDate;
		this.up = !!up;
		this.txHash = txHash || '';
		this.signature = signature || '';
		// console.log("this:", this);
		if (!ajv.validate(schema, this)) throw new Error('Invalid Vote: ' + JSON.stringify(this));
		// console.log('this:', this);
		if (this.signature && !this.validSignature) throw new Error('Invalid signature');
	}

	get dbColumns() {
		return {
			voteDate: this.voteDate,
			voterId: this.voterId,
			thoughtId: this.thoughtId,
			up: this.up || null,
			txHash: this.txHash || null,
			signature: this.signature,
		};
	}

	get clientProps() {
		return {
			voteDate: this.voteDate || undefined,
			voterId: this.voterId || undefined,
			thoughtId: this.thoughtId || undefined,
			up: this.up || undefined,
			txHash: this.txHash || undefined,
			signature: this.signature || undefined,
		};
	}

	get validSignature() {
		return verifyItem(this.unsigned, this.voterId, this.signature);
	}

	get unsigned() {
		return {
			voterId: this.voterId,
			up: this.up,
			thoughtId: this.thoughtId,
			voteDate: this.voteDate,
			txHash: this.txHash,
		};
	}

	get signed() {
		if (this.signature && !this.validSignature) throw new Error('Invalid signature');
		return { ...this.unsigned, signature: this.signature };
	}

	sign(privateKey: string) {
		this.voteDate = Date.now();
		this.signature = signItem(this.unsigned, privateKey);
	}
}

export type UnsignedVote = Vote['unsigned'];
export type SignedVote = Vote['signed'];
