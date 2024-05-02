export type RootSettings = {
	testWorkingDirectory: boolean;
};

export type WorkingDirectory = {
	gitSnapshotsEnabled: boolean;
	gitRemoteUrl?: string;
	dirPath: string;
};

export type UnsignedSelf = {
	writeDate?: number;
	id: string;
	name?: string;
	frozen?: true;
	walletAddress?: string;
};

export type SignedSelf = UnsignedSelf & {
	signature?: string;
};

export type Personas = (SignedSelf & {
	locked?: true;
	spaceHosts: string[];
	encryptedMnemonic?: string; // this is only for clients not hosted locally
})[];

export type Space = {
	host: string;
	name?: string;
	hubAddress?: string;
	faucetAddress?: string;
	owner?: {
		id: string;
		name?: string;
	};
	fetchedSelf?:
		| null
		| (SignedSelf & {
				addDate: number;
				addedBy?: {
					id: string;
					name?: string;
				};
		  });
};
