export let passwords: Record<string, string> = {};

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
	id: string;
	encryptedMnemonic?: string;
	spaceHosts: string[];
	locked?: boolean;
};

export function getUnsignedSelf(persona: { id: string } & Partial<Persona>) {
	const unsignedSelf: UnsignedSelf = {
		writeDate: Date.now(),
		id: persona.id,
		name: persona.name,
		frozen: persona.frozen,
		walletAddress: persona.walletAddress,
	};
	return unsignedSelf;
}
