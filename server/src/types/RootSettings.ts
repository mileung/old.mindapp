import Ajv from 'ajv';
import { parseFile, rootSettingsPath, writeObjectFile } from '../utils/files';
import { WorkingDirectory } from './WorkingDirectory';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		theme: { type: 'string', enum: ['System', 'Light', 'Dark'] },
		usingDefaultWorkingDirectoryPath: { type: 'boolean' },
		// customWorkingDirectoryPath: { type: 'string' },
	},
	required: [
		'theme',
		'usingDefaultWorkingDirectoryPath',
		// 'customWorkingDirectoryPath',
	],
	additionalProperties: false,
};

export class RootSettings {
	public theme: string;
	public usingDefaultWorkingDirectoryPath: boolean;
	// public customWorkingDirectoryPath?: string;

	constructor({
		theme = 'System',
		usingDefaultWorkingDirectoryPath = true,
		// customWorkingDirectoryPath,
	}: {
		theme?: string;
		usingDefaultWorkingDirectoryPath?: boolean;
		// customWorkingDirectoryPath?: string;
	}) {
		this.theme = theme;
		this.usingDefaultWorkingDirectoryPath = usingDefaultWorkingDirectoryPath;
		// // this.customWorkingDirectoryPath = customWorkingDirectoryPath;

		if (!ajv.validate(schema, this))
			throw new Error('Invalid Root Settings: ' + JSON.stringify(this));
	}

	static get() {
		return new RootSettings(parseFile(rootSettingsPath));
	}

	overwrite() {
		if (
			RootSettings.get().usingDefaultWorkingDirectoryPath !== this.usingDefaultWorkingDirectoryPath
		) {
			WorkingDirectory.current.setUp();
		}
		writeObjectFile(rootSettingsPath, this);
	}
}
