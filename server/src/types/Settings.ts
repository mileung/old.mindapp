import Ajv from 'ajv';
import { parseFile, settingsPath, writeFile } from '../utils/files';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		gitSnapshotsEnabled: { type: 'boolean' },
		// branchName: { type: 'string' },
		gitRemoteUrl: { type: ['null', 'string'] },
		themeMode: { type: 'string', enum: ['System', 'Light', 'Dark'] },
		preferredName: { type: 'string' },
	},
	required: [
		'gitSnapshotsEnabled',
		// 'branchName',
		'gitRemoteUrl',
		'themeMode',
		'preferredName',
	],
	additionalProperties: false,
};

export class Settings {
	public gitSnapshotsEnabled: boolean;
	// public branchName: string;
	public gitRemoteUrl: null | string;
	public themeMode: string;
	public preferredName: string;
	constructor({
		gitSnapshotsEnabled = true,
		// branchName = 'main',
		gitRemoteUrl = null,
		themeMode = 'System',
		preferredName = '',
	}: {
		gitSnapshotsEnabled?: boolean;
		// branchName?: string;
		gitRemoteUrl?: null | string;
		themeMode?: string;
		preferredName?: string;
	}) {
		this.gitSnapshotsEnabled = gitSnapshotsEnabled;
		// this.branchName = branchName;
		this.gitRemoteUrl = gitRemoteUrl;
		this.themeMode = themeMode;
		this.preferredName = preferredName;

		if (!ajv.validate(schema, this)) throw new Error('Invalid Settings: ' + JSON.stringify(this));
	}

	static get() {
		return new Settings(parseFile(settingsPath));
	}

	overwrite() {
		return writeFile(settingsPath, JSON.stringify(this));
	}
}
