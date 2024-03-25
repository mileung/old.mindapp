import Ajv from 'ajv';
import { parseFile, rootSettingsPath, writeObjectFile } from '../utils/files';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		theme: { type: 'string', enum: ['System', 'Light', 'Dark'] },
		usingDefaultWorkspacePath: { type: 'boolean' },
		// customWorkspacePath: { type: 'string' },
	},
	required: [
		'theme',
		'usingDefaultWorkspacePath',
		// 'customWorkspacePath',
	],
	additionalProperties: false,
};

export class RootSettings {
	public theme: string;
	public usingDefaultWorkspacePath: boolean;
	// public customWorkspacePath?: string;

	constructor({
		theme = 'System',
		usingDefaultWorkspacePath = true,
		// customWorkspacePath,
	}: {
		theme?: string;
		usingDefaultWorkspacePath?: boolean;
		// customWorkspacePath?: string;
	}) {
		this.theme = theme;
		this.usingDefaultWorkspacePath = usingDefaultWorkspacePath;
		// // this.customWorkspacePath = customWorkspacePath;

		if (!ajv.validate(schema, this))
			throw new Error('Invalid Root Settings: ' + JSON.stringify(this));
	}

	static get() {
		return new RootSettings(parseFile(rootSettingsPath));
	}

	overwrite() {
		writeObjectFile(rootSettingsPath, this);
	}
}
