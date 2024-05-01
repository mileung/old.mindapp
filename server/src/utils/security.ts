import crypto from 'crypto';
import * as bip32 from '@scure/bip32';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { base58 } from '@scure/base';
import * as secp256k1 from 'secp256k1';
import { drizzleClient } from '../db';
import { personasTable } from '../db/schema';
import { and, eq, exists } from 'drizzle-orm';
import env from './env';
import { sortKeysRecursively } from './js';

export type Item = string | Record<string, any> | any[];

export function encrypt(text: string, password: string) {
	const iv = crypto.randomBytes(16);
	const key = crypto
		.createHash('sha256')
		.update(String(password))
		.digest('base64')
		.substring(0, 32);
	const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	return `${base58.encode(iv)}:${base58.encode(Buffer.from(encrypted, 'hex'))}`;
}

export function decrypt(encrypted: string, password: string) {
	const [iv, encryptedText] = encrypted.split(':');
	const key = crypto
		.createHash('sha256')
		.update(String(password))
		.digest('base64')
		.substring(0, 32);
	const decipher = crypto.createDecipheriv('aes-256-ctr', key, base58.decode(iv));
	let decrypted = decipher.update(
		Buffer.from(base58.decode(encryptedText)).toString('hex'),
		'hex',
		'utf8',
	);
	decrypted += decipher.final('utf8');
	return decrypted;
}

export function createKeyPair(mnemonic?: string) {
	mnemonic = bip39.validateMnemonic(mnemonic!, wordlist)
		? mnemonic!
		: bip39.generateMnemonic(wordlist);
	const seed = bip39.mnemonicToSeedSync(mnemonic);
	const masterKey = bip32.HDKey.fromMasterSeed(seed);
	const address_index = 0;
	const childKey = masterKey.derive(`m/44'/0'/0'/0/${address_index}`);

	return {
		privateKey: base58.encode(childKey.privateKey!),
		publicKey: base58.encode(childKey.publicKey!),
	};
}

function bufferItem(item: Item) {
	item = typeof item === 'string' ? item : JSON.stringify(sortKeysRecursively(item));
	const sha256ItemHash = crypto.createHash('sha256').update(item).digest('hex');
	const itemBuffer = Buffer.from(sha256ItemHash, 'hex');
	return itemBuffer;
}

export function signItem(item: Item, privateKey: string) {
	const privKeyBuffer = base58.decode(privateKey);
	const { signature } = secp256k1.ecdsaSign(bufferItem(item), privKeyBuffer);
	return base58.encode(signature);
}

export function verifyItem(item: Item, publicKey: string, signature?: string) {
	if (!signature) return false;
	const publicKeyBuffer = base58.decode(publicKey);
	const isValid = secp256k1.ecdsaVerify(
		base58.decode(signature),
		bufferItem(item),
		publicKeyBuffer,
	);
	return isValid;
}

export function hashString(str: string) {
	return base58.encode(bufferItem(str));
}

// const message =
// 	'This is an example of a signed message. This is an example of a signed message. This is an example of a signed message.';
// const kp = createKeyPair();
// console.log('kp:', kp);
// const sig = signItem(message, kp.privateKey);
// const result = verifyItem(message, kp.publicKey, sig);
// console.log('result:', result);

// console.log(1, bufferItem('test').toString('hex'));
// 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
// console.log(2, base58.encode(bufferItem('test')));
// Bjj4AWTNrjQVHqgWbP2XaxXz4DYH1WZMyERHxsad7b2w
// console.log(hashString('test'));
// Bjj4AWTNrjQVHqgWbP2XaxXz4DYH1WZMyERHxsad7b2w

export async function checkPrivilege(personaId?: string) {
	if (personaId === env.ownerId || !env.isGlobalSpace) {
		return {
			read: true,
			write: true,
		};
	} else if (!personaId) {
		return {
			// read: env.nullCanRead,
			// write: env.nullCanWrite,
			read: env.anyoneCanJoin,
			write: env.anyoneCanJoin,
		};
	}

	const [row] = await drizzleClient
		.select()
		.from(personasTable)
		.where(eq(personasTable.id, personaId))
		.limit(1);
	return row
		? {
				read: true, // !!row.read,
				write: true, // !!row.write,
			}
		: {
				// read: env.nullCanRead,
				// write: env.nullCanWrite,
				read: env.anyoneCanJoin,
				write: env.anyoneCanJoin,
			};
}

export async function inGroup(personaId?: string) {
	if (!personaId) {
		return undefined;
	}
	const result = await drizzleClient
		.select()
		.from(personasTable)
		.where(eq(personasTable.id, personaId))
		.limit(1);

	return result[0]
		? {
				id: result[0].id || undefined,
				name: result[0].name || undefined,
				frozen: result[0].frozen || undefined,
				walletAddress: result[0].walletAddress || undefined,
				writeDate: result[0].writeDate || undefined,
				signature: result[0].signature || undefined,

				addDate: result[0].addDate,
				addedById: result[0].addedById || undefined,
			}
		: undefined;
}
