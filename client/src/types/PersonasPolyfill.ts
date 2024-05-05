// import Ajv from 'ajv';
// import { WorkingDirectory } from './WorkingDirectory';
// import { parseFile, writeObjectFile } from '../utils/files';
// import { Item, createKeyPair, decrypt, encrypt, signItem } from '../utils/security';
// import { validateMnemonic } from '@scure/bip39';
// import { wordlist } from '@scure/bip39/wordlists/english';
// import { wallet } from '@vite/vitejs/es5';
// import { getLocalState, updateLocalState } from '../utils/state';
// import env from '../utils/env';
// import { inGroup } from '../db';

// const ajv = new Ajv();

// const schema = {
// 	type: 'object',
// 	properties: {
// 		list: {
// 			type: 'array',
// 			items: {
// 				type: 'object',
// 				properties: {
// 					encryptedMnemonic: { type: 'string' },
// 					id: { type: 'string' },
// 					name: { type: 'string' },
// 					walletAddress: { type: 'string' },
// 					frozen: { type: 'boolean' },
// 					writeDate: { type: 'number' },
// 					signature: { type: 'string' },
// 					spaceHosts: {
// 						type: 'array',
// 						items: { type: 'string' },
// 					},
// 				},
// 				required: ['id', 'spaceHosts'],
// 			},
// 		},
// 	},
// 	required: ['list'],
// 	additionalProperties: false,
// };

export type UnsignedSelf = {
	writeDate: number;
	id: string;
	name?: string;
	frozen?: true;
	walletAddress?: string;
};

export type SignedSelf = UnsignedSelf & {
	signature: string;
};

export type Persona = Partial<SignedSelf> & {
	encryptedMnemonic?: string;
	mnemonic?: string;
	spaceHosts: string[];
};

// let passwords: Record<string, string> = {};

// export class Personas {
// 	public list: Persona[];

// 	constructor({ list = [{ id: '', spaceHosts: [''] }] }: { list?: Persona[] }) {
// 		// if (env.GLOBAL_HOST) throw new Error('Global space cannot use Personas');
// 		this.list = list;
// 		// console.log("this:", this);
// 		if (!ajv.validate(schema, this)) throw new Error('Invalid Personas: ' + JSON.stringify(this));
// 	}

// 	get clientArr() {
// 		const list = this.list.map((p, i) => {
// 			return {
// 				...p,
// 				encryptedMnemonic: undefined,
// 				locked: (p.id && passwords[p.id] === undefined) || undefined,
// 			};
// 		});
// 		return list;
// 	}

// 	static get() {
// 		const localState = getLocalState();
// 		return new Personas({ list: localState.personas });
// 	}

// 	get savedProps() {
// 		return {
// 			list: this.list,
// 		};
// 	}

// 	overwrite() {
// 		// writeObjectFile(WorkingDirectory.current.personasPath, this.savedProps);
// 		const localState = getLocalState();
// 		updateLocalState({ ...localState, personas: this.savedProps.list });
// 	}

// 	prioritizePersona(personaId: string, index = 0) {
// 		const personaIndex = this.findIndex(personaId);
// 		if (personaIndex === -1) throw new Error('Persona not found');
// 		this.list.splice(index, 0, this.list.splice(personaIndex, 1)[0]);
// 		this.overwrite();
// 	}

// 	prioritizeSpace(personaId: string, spaceHost: string, index = 0) {
// 		const personaIndex = this.findIndex(personaId);
// 		if (personaIndex === -1) throw new Error('persona Persona not found');
// 		const persona = this.list[personaIndex];
// 		const spaceIndex = persona.spaceHosts.findIndex((id) => id === spaceHost);
// 		if (spaceIndex === -1) throw new Error('space persona not found');
// 		persona.spaceHosts.splice(index, 0, persona.spaceHosts.splice(spaceIndex, 1)[0]);
// 		this.overwrite();
// 	}

// 	addSpace(personaId: string, spaceHost: string) {
// 		const persona = this.find(personaId);
// 		if (!persona) throw new Error('Persona not found');
// 		persona.spaceHosts.unshift(spaceHost);
// 		this.overwrite();
// 	}

// 	removeSpace(personaId: string, spaceHost: string) {
// 		const persona = this.find(personaId);
// 		if (!persona) throw new Error('Persona not found');
// 		persona.spaceHosts.splice(persona.spaceHosts.indexOf(spaceHost), 1);
// 		this.overwrite();
// 	}

// 	addPersona({
// 		mnemonic,
// 		password,
// 		name,
// 		frozen,
// 		walletAddress,
// 	}: {
// 		mnemonic: string;
// 		password: string;
// 		name?: string;
// 		frozen?: true;
// 		walletAddress?: string;
// 	}) {
// 		const { publicKey, privateKey } = createKeyPair(mnemonic);
// 		if (this.find(publicKey)) throw new Error('publicKey already used');
// 		const writeDate = Date.now();
// 		const unsignedSelf: UnsignedSelf = {
// 			writeDate,
// 			id: publicKey,
// 			name,
// 			frozen,
// 			walletAddress:
// 				walletAddress || wallet.deriveAddress({ mnemonics: mnemonic, index: 0 }).address,
// 		};
// 		const signedSelf: SignedSelf = {
// 			...unsignedSelf,
// 			signature: signItem(unsignedSelf, privateKey),
// 		};
// 		this.list.unshift({
// 			...signedSelf,
// 			encryptedMnemonic: encrypt(mnemonic, password),
// 			spaceHosts: [''],
// 		});
// 		passwords[publicKey] = password;
// 		this.overwrite();
// 		return publicKey;
// 	}

// 	updateLocalPersona(
// 		personaId: string,
// 		updates: {
// 			name?: string;
// 			// walletAddress: string;
// 			frozen?: true;
// 		},
// 	) {
// 		if (!personaId) throw new Error('Anon cannot have a name');
// 		const personaIndex = this.findIndex(personaId);
// 		const persona = this.list[personaIndex];
// 		if (!persona) throw new Error('Persona not found');
// 		Object.assign(persona, updates);
// 		const writeDate = Date.now();
// 		if (!persona.walletAddress) throw new Error('Missing persona.walletAddress');
// 		const unsignedSelf: UnsignedSelf = {
// 			writeDate,
// 			id: personaId,
// 			name: updates.name,
// 			walletAddress: persona.walletAddress,
// 			frozen: updates.frozen,
// 		};
// 		const signedSelf: SignedSelf = {
// 			...unsignedSelf,
// 			signature: this.getSignature(unsignedSelf, personaId),
// 		};
// 		this.list[personaIndex] = {
// 			...persona,
// 			...signedSelf,
// 		};
// 		this.overwrite();
// 	}

// 	deletePersona(personaId: string, mnemonic: string) {
// 		if (!personaId) throw new Error('Anon cannot be deleted');
// 		if (passwords[personaId] === undefined) throw new Error('Persona locked');
// 		const personaIndex = this.findIndex(personaId);
// 		if (personaIndex === -1) throw new Error('Persona not found');
// 		const persona = this.list[personaIndex];
// 		const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, passwords[personaId]);
// 		const deleted = mnemonic === decryptedMnemonic;
// 		if (deleted) {
// 			this.list.splice(personaIndex, 1);
// 			this.overwrite();
// 		}
// 		return deleted;
// 	}

// 	unlockPersona(personaId: string, password: string) {
// 		if (!personaId) throw new Error('Anon is always unlocked');
// 		const persona = this.find(personaId);
// 		if (!persona) throw new Error('Persona not found');
// 		const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, password);
// 		const valid = validateMnemonic(decryptedMnemonic, wordlist);
// 		if (valid) passwords[personaId] = password;
// 		return valid;
// 	}

// 	getPersonaMnemonic(personaId: string, password: string) {
// 		if (!personaId) throw new Error('Anon cannot have a mnemonic');
// 		const persona = this.find(personaId);
// 		if (!persona) throw new Error('Persona not found');
// 		const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, password);
// 		const valid = validateMnemonic(decryptedMnemonic, wordlist);
// 		if (valid) {
// 			passwords[personaId] = password;
// 			return decryptedMnemonic;
// 		}
// 		return '';
// 	}

// 	updatePersonaPassword(personaId: string, oldPassword: string, newPassword: string) {
// 		if (!personaId) throw new Error('Anon cannot have a password');
// 		const persona = this.find(personaId);
// 		if (!personaId || !persona) throw new Error('Persona not found');
// 		const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, oldPassword);
// 		const valid = validateMnemonic(decryptedMnemonic, wordlist);
// 		if (valid) {
// 			passwords[personaId] = newPassword;
// 			persona.encryptedMnemonic = encrypt(decryptedMnemonic, newPassword);
// 			this.overwrite();
// 		}
// 		return valid;
// 	}

// 	find(personaId: string) {
// 		return this.list.find((p) => p.id === personaId);
// 	}

// 	findIndex(personaId: string) {
// 		return this.list.findIndex((p) => p.id === personaId);
// 	}

// 	getSignature(item: Item, personaId: string) {
// 		if (!personaId) throw new Error('Anon cannot sign items');
// 		const locked = passwords[personaId] === undefined;
// 		if (locked) throw new Error('Persona locked');
// 		const persona = this.find(personaId);
// 		if (!persona) throw new Error('Persona not found');
// 		const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, passwords[personaId]);
// 		const { publicKey, privateKey } = createKeyPair(decryptedMnemonic);
// 		if (publicKey !== personaId) {
// 			throw new Error('Mnemonic on file does not correspond to personaId');
// 		}
// 		return signItem(item, privateKey);
// 	}

// 	static lockAllPersonas() {
// 		passwords = {};
// 	}

// 	// static async getDefaultName(personaId: string, spaceHost?: string) {
// 	// 	if (!env.GLOBAL_HOST && !spaceHost) {
// 	// 		const persona = Personas.get().find(personaId);
// 	// 		if (persona) return persona.name;
// 	// 	}
// 	// 	return (await inGroup(personaId))?.name;
// 	// }
// }
