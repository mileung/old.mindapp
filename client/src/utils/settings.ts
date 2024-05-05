import { SignedSelf } from '../types/PersonasPolyfill';

export type RootSettings = {
	testWorkingDirectory: boolean;
};

export type WorkingDirectory = {
	gitSnapshotsEnabled: boolean;
	gitRemoteUrl?: string;
	dirPath: string;
};

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
