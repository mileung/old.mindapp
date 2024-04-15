import crypto from 'crypto';
// import * as bitcoin from 'bitcoinjs-lib';
// import * as bitcoinMessage from 'bitcoinjs-message';
import * as bip32 from '@scure/bip32';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { base58 } from '@scure/base';
import * as secp256k1 from 'secp256k1';

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
	// let encrypted = cipher.update(text, 'utf8', 'hex');
	// encrypted += cipher.final('hex');
	// return `${iv.toString('hex')}:${encrypted}`;
	return `${base58.encode(iv)}:${base58.encode(Buffer.from(encrypted, 'hex'))}`;
}

export function decrypt(encrypted: string, password: string) {
	const [iv, encryptedText] = encrypted.split(':');
	const key = crypto
		.createHash('sha256')
		.update(String(password))
		.digest('base64')
		.substring(0, 32);
	// const decipher = crypto.createDecipheriv('aes-256-ctr', key, Buffer.from(iv, 'hex'));
	const decipher = crypto.createDecipheriv('aes-256-ctr', key, base58.decode(iv));
	// let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
	let decrypted = decipher.update(
		Buffer.from(base58.decode(encryptedText)).toString('hex'),
		'hex',
		'utf8',
	);
	decrypted += decipher.final('utf8');
	return decrypted;
}

// const mnemonic = bip39.generateMnemonic(wordlist);
// console.log('Mnemonic:', mnemonic);
// // Derive the seed from the mnemonic
// const seed = bip39.mnemonicToSeedSync(mnemonic);
// // const seed = Buffer.from(bip39.mnemonicToSeedSync(mnemonic));

// console.log('seed:', seed);
// const masterKey = bip32.HDKey.fromMasterSeed(seed);
// console.log('masterKey:', masterKey);
// const address_index = 0;
// // Derive the child key (e.g., the first receiving address)
// const childKey = masterKey.derive(`m/44'/0'/0'/0/${address_index}`);
// // const privateKey = Buffer.from(childKey.privateKey!).toString('hex');
// // const publicKey = Buffer.from(childKey.publicKey!).toString('hex');
// const privateKey = Buffer.from(childKey.privateKey!);
// const publicKey = Buffer.from(childKey.publicKey!);
// console.log('privateKey:', privateKey);
// console.log('publicKey:', publicKey);

// // Get the Bitcoin address derived from the public key
// const { address } = bitcoin.payments.p2pkh({ pubkey: publicKey });

// console.log('Private Key:', privateKey!.toString('hex'));
// console.log('Public Key:', publicKey.toString('hex'));
// console.log('Bitcoin Address:', address);

// const keyPair = bitcoin.ECPair.fromPrivateKey(privateKey);

// const signature = bitcoinMessage.sign(message, privateKey!, keyPair.compressed);
// console.log('signature:', signature.toString('hex').length);

// const isValid = bitcoinMessage.verify(message, address!, signature);

// console.log('Signature is valid:', isValid); // true

export function createKeyPair(mnemonic?: string) {
	mnemonic = bip39.validateMnemonic(mnemonic!, wordlist)
		? mnemonic!
		: bip39.generateMnemonic(wordlist);
	const seed = bip39.mnemonicToSeedSync(mnemonic);
	// const seed = Buffer.from(bip39.mnemonicToSeedSync(mnemonic));
	const masterKey = bip32.HDKey.fromMasterSeed(seed);
	const address_index = 0;
	const childKey = masterKey.derive(`m/44'/0'/0'/0/${address_index}`);
	// const ROOT_PATH = "m/44'/666666'"; // this is what's in @vite/vitejs
	// function getPath(index: number): string {
	// 	return `${ROOT_PATH}/${index}\'`;
	// }
	// const childKey = masterKey.derive(getPath(0));
	// const { address } = bitcoin.payments.p2pkh({ pubkey: Buffer.from(childKey.publicKey!) });

	return {
		// address: address!,
		// privateKey: Buffer.from(childKey.privateKey!).toString('hex'),
		// publicKey: Buffer.from(childKey.publicKey!).toString('hex'),
		privateKey: base58.encode(childKey.privateKey!),
		publicKey: base58.encode(childKey.publicKey!),
	};
}

// export function signMessage(message: string, privateKey: string) {
// 	const privKeyBuffer = Buffer.from(privateKey, 'hex');
// 	const keyPair = bitcoin.ECPair.fromPrivateKey(privKeyBuffer);
// 	const signature = bitcoinMessage.sign(message, privKeyBuffer, keyPair.compressed);
// 	return Buffer.from(signature).toString('hex');
// }

// export function verifyMessage(message: string, publicKey: string, signature: string) {
// 	const { address } = bitcoin.payments.p2pkh({ pubkey: Buffer.from(publicKey!, 'hex') });
// 	const isValid = bitcoinMessage.verify(message, address!, Buffer.from(signature, 'hex'));
// 	console.log('isValid:', isValid);
// 	// bip32.HDKey.
// 	return isValid;
// }

function bufferMessage(message: string) {
	const sha256MessageHash = crypto.createHash('sha256').update(message).digest('hex');
	const messageBuffer = Buffer.from(sha256MessageHash, 'hex');
	return messageBuffer;
}

export function signMessage(message: string, privateKey: string) {
	// const privKeyBuffer = Buffer.from(privateKey, 'hex');
	const privKeyBuffer = base58.decode(privateKey);
	const { signature } = secp256k1.ecdsaSign(bufferMessage(message), privKeyBuffer);
	// return Buffer.from(signature).toString('hex');
	return base58.encode(signature);
}

export function verifyMessage(message: string, publicKey: string, signature: string) {
	// const publicKeyBuffer = Buffer.from(publicKey, 'hex');
	const publicKeyBuffer = base58.decode(publicKey);
	const isValid = secp256k1.ecdsaVerify(
		// Buffer.from(signature, 'hex'),
		base58.decode(signature),
		bufferMessage(message),
		publicKeyBuffer,
	);
	return isValid;
}

// const message =
// 	'This is an example of a signed message. This is an example of a signed message. This is an example of a signed message.';
// const kp = createKeyPair();
// console.log('kp:', kp);
// const sig = signMessage(message, kp.privateKey);
// const result = verifyMessage(message, kp.publicKey, sig);
// console.log('result:', result);
