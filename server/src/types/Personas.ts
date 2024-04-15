import Ajv from 'ajv';
import { WorkingDirectory } from './WorkingDirectory';
import { parseFile, writeObjectFile } from '../utils/files';
import { createKeyPair, decrypt, encrypt, signMessage } from '../utils/security';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { wallet } from '@vite/vitejs';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		list: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					encryptedMnemonic: { type: 'string' },
					defaultName: { type: 'string' },
					spaceIds: {
						type: 'array',
						items: { type: 'string' },
					},
				},
				required: ['id', 'encryptedMnemonic', 'defaultName', 'spaceIds'],
			},
		},
	},
	required: ['list'],
	additionalProperties: false,
};

type Persona = {
	id: string;
	defaultName: string;
	encryptedMnemonic: string;
	spaceIds: string[];
};

let passwords: Record<string, string> = {};

export class Personas {
	public list: Persona[];

	constructor({ list = [] }: { list?: Persona[] }) {
		this.list = list;
		// console.log("this:", this);
		if (!ajv.validate(schema, this)) throw new Error('Invalid Personas: ' + JSON.stringify(this));
	}

	get arr() {
		return Personas.get().list.map(({ id, defaultName, spaceIds }) => ({
			id,
			spaceIds,
			defaultName: defaultName,
			locked: passwords[id] === undefined,
		}));
	}

	static get() {
		return new Personas(parseFile(WorkingDirectory.current.personasPath));
	}

	static getPersona(personaId: string) {
		const personas = new Personas(parseFile(WorkingDirectory.current.personasPath));
		return personas.list.find((p) => p.id === personaId) || null;
	}

	get savedProps() {
		return {
			list: this.list,
		};
	}

	overwrite() {
		writeObjectFile(WorkingDirectory.current.personasPath, this.savedProps);
	}

	setFirstPersona(personaId: string) {
		const personaIndex = this.findIndex(personaId);
		if (personaIndex === -1) throw new Error('Persona not found');
		this.list.unshift(this.list.splice(personaIndex, 1)[0]);
		this.overwrite();
	}

	deletePersona(personaId: string, mnemonic: string) {
		if (passwords[personaId] === undefined) throw new Error('Persona locked');
		const personaIndex = this.findIndex(personaId);
		if (personaIndex === -1) throw new Error('Persona not found');
		const persona = this.list[personaIndex];
		const decryptedMnemonic = decrypt(persona.encryptedMnemonic, passwords[personaId]);
		const deleted = mnemonic === decryptedMnemonic;
		if (deleted) {
			this.list.splice(personaIndex, 1);
			this.overwrite();
		}
		return deleted;
	}

	setFirstSpace(personaId: string, spaceId: string) {
		const personaIndex = this.findIndex(personaId);
		if (!personaId || personaIndex === -1) throw new Error('persona Persona not found');
		const persona = this.list[personaIndex];
		const spaceIndex = persona.spaceIds.findIndex((id) => id === spaceId);
		if (!spaceId || spaceIndex === -1) throw new Error('space Persona not found');
		persona.spaceIds.unshift(persona.spaceIds.splice(personaIndex, 1)[0]);
		this.overwrite();
	}

	addPersona(mnemonic: string, password: string, defaultName: string) {
		const { publicKey } = createKeyPair(mnemonic);
		if (this.find(publicKey)) throw new Error('publicKey already used');
		this.list.unshift({
			id: publicKey,
			encryptedMnemonic: encrypt(mnemonic, password),
			defaultName,
			spaceIds: [],
		});
		passwords[publicKey] = '';
		this.overwrite();
		return publicKey;
	}

	unlockPersona(personaId: string, password: string) {
		const persona = this.find(personaId);
		if (!persona) throw new Error('Persona not found');
		const decryptedMnemonic = decrypt(persona.encryptedMnemonic, password);
		const valid = validateMnemonic(decryptedMnemonic, wordlist);
		if (valid) passwords[personaId] = password;
		return valid;
	}

	getPersonaMnemonic(personaId: string, password: string) {
		const persona = this.find(personaId);
		if (!persona) throw new Error('Persona not found');
		const decryptedMnemonic = decrypt(persona.encryptedMnemonic, password);
		const valid = validateMnemonic(decryptedMnemonic, wordlist);
		if (valid) {
			passwords[personaId] = password;
			return decryptedMnemonic;
		}
		return '';
	}

	updatePersonaDefaultName(personaId: string, defaultName: string) {
		const persona = this.find(personaId);
		if (!persona) throw new Error('Persona not found');
		persona.defaultName = defaultName;
		this.overwrite();
	}

	updatePersonaPassword(personaId: string, oldPassword: string, newPassword: string) {
		const persona = this.find(personaId);
		if (!personaId || !persona) throw new Error('Persona not found');
		const decryptedMnemonic = decrypt(persona.encryptedMnemonic, oldPassword);
		const valid = validateMnemonic(decryptedMnemonic, wordlist);
		if (valid) {
			passwords[personaId] = newPassword;
			persona.encryptedMnemonic = encrypt(decryptedMnemonic, newPassword);
			this.overwrite();
		}
		return valid;
	}

	find(personaId: string) {
		return this.list.find((p) => p.id === personaId);
	}

	findIndex(personaId: string) {
		return this.list.findIndex((p) => p.id === personaId);
	}

	signMessageAs(message: string, personaId: string) {
		const locked = passwords[personaId] === undefined;
		if (locked) throw new Error('Persona locked');
		const persona = this.find(personaId);
		if (!persona) throw new Error('Persona not found');
		const decryptedMnemonic = decrypt(persona.encryptedMnemonic, passwords[personaId]);
		const { publicKey, privateKey } = createKeyPair(decryptedMnemonic);
		if (publicKey !== personaId) {
			throw new Error('Mnemonic on file does not correspond to personaId');
		}
		return signMessage(message, privateKey);
	}

	static lockAllPersonas() {
		passwords = {};
	}

	static getDefaultName(personaId: string, spaceId?: string) {
		if (!spaceId) {
			const persona = Personas.get().find(personaId);
			if (!persona) throw new Error('Persona not found');
			return persona.defaultName;
		}
		// TODO: ask space with spaceId for defaultName of personaId
		return '';
	}

	getViteAddress(personaId: string) {
		const persona = this.find(personaId);
		if (!persona) throw new Error('Persona not found');
		const mnemonic = this.getPersonaMnemonic(personaId, passwords[personaId]);
		const first = wallet.deriveAddress({ mnemonics: mnemonic, index: 0 });
		const second = wallet.getAddressFromPublicKey(personaId);
	}
}
