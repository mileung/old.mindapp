export type RootSettings = {
	theme: 'System' | 'Light' | 'Dark';
	usingDefaultWorkingDirectoryPath: boolean;
};

export type WorkingDirectory = {
	gitSnapshotsEnabled: boolean;
	gitRemoteUrl?: string;
	dirPath: string;
};

export type Personas = {
	id: string;
	defaultName: string;
	locked: boolean;
	spaces: {
		id: string;
		defaultName?: string;
	}[];
}[];
