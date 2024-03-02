import Ajv from 'ajv';
import { parseFile, settingsPath, writeObjectFile } from '../utils/files';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		themeMode: { type: 'string', enum: ['System', 'Light', 'Dark'] },
		preferredName: { type: 'string' },
		gitSnapshotsEnabled: { type: 'boolean' },
		gitRemoteUrl: { type: ['null', 'string'] },
		// developerMode: { type: 'boolean' },
	},
	required: [
		'themeMode',
		'preferredName',
		'gitSnapshotsEnabled',
		'gitRemoteUrl',
		// 'developerMode',
	],
	additionalProperties: false,
};

export class Settings {
	public themeMode: string;
	public preferredName: string;
	public gitSnapshotsEnabled: boolean;
	public gitRemoteUrl: null | string;
	// public developerMode: boolean;
	constructor({
		themeMode = 'System',
		preferredName = '',
		gitSnapshotsEnabled = true,
		gitRemoteUrl = null,
		// developerMode = false,
	}: {
		themeMode?: string;
		preferredName?: string;
		gitSnapshotsEnabled?: boolean;
		gitRemoteUrl?: null | string;
		// developerMode?: boolean;
	}) {
		this.themeMode = themeMode;
		this.preferredName = preferredName;
		this.gitSnapshotsEnabled = gitSnapshotsEnabled;
		this.gitRemoteUrl = gitRemoteUrl;
		// this.developerMode = developerMode;

		if (!ajv.validate(schema, this)) throw new Error('Invalid Settings: ' + JSON.stringify(this));
	}

	static get() {
		return new Settings(parseFile(settingsPath));
	}

	overwrite() {
		writeObjectFile(settingsPath, this);
	}
}
