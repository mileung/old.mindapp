import path from 'path';
import simpleGit from 'simple-git';
import { setUpIndex } from '../utils';
import {
	defaultWorkingDirectoryPath,
	mkdirIfDne,
	parseFile,
	testWorkingDirectoryPath,
	touchIfDne,
	writeObjectFile,
} from '../utils/files';
import { RootSettings } from './RootSettings';
import TagTree from './TagTree';
import Ajv from 'ajv';
import { Personas } from './Personas';

const ajv = new Ajv();

const schema = {
	type: 'object',
	properties: {
		dirPath: { type: 'string' },
		gitSnapshotsEnabled: { type: 'boolean' },
		gitRemoteUrl: { type: 'string' },
	},
	required: ['dirPath', 'gitSnapshotsEnabled'],
	additionalProperties: false,
};

export class WorkingDirectory {
	public dirPath: string;
	public gitSnapshotsEnabled: boolean;
	public gitRemoteUrl?: string;

	constructor({
		dirPath,
		gitSnapshotsEnabled = true,
		gitRemoteUrl,
	}: {
		dirPath: string;
		gitSnapshotsEnabled?: boolean;
		gitRemoteUrl?: string;
	}) {
		this.dirPath = dirPath;
		this.gitSnapshotsEnabled = gitSnapshotsEnabled;
		this.gitRemoteUrl = gitRemoteUrl;
		if (!ajv.validate(schema, this))
			throw new Error('Invalid Root Settings: ' + JSON.stringify(this));
	}

	static get current() {
		const rootSettings = RootSettings.get();
		const dirPath = rootSettings.usingDefaultWorkingDirectoryPath
			? defaultWorkingDirectoryPath
			: testWorkingDirectoryPath;
		const newWorkingDirectory = new WorkingDirectory({ dirPath });
		try {
			const settings = parseFile<WorkingDirectory>(newWorkingDirectory.settingsPath);
			return new WorkingDirectory({ ...settings, dirPath });
		} catch (error) {
			return newWorkingDirectory;
		}
	}

	setUp() {
		setUpIndex();
		mkdirIfDne(this.dirPath);
		mkdirIfDne(this.timelinePath);
		touchIfDne(this.personasPath, JSON.stringify(new Personas({})));
		touchIfDne(this.tagTreePath, JSON.stringify(new TagTree({ parents: {}, loners: [] })));
		touchIfDne(this.settingsPath, JSON.stringify(this.savedProps));
		const git = simpleGit(this.dirPath);
		git.checkIsRepo((e, isRepo) => {
			if (e) return console.error('Error checking repository:', e);
			if (!isRepo) {
				git
					.init((e) => {
						e
							? console.error('Error initializing repository:', e)
							: console.log(`Repository initialized at ${this.dirPath}`);
					})
					.checkoutLocalBranch('master');
			}
		});
	}

	get timelinePath() {
		return path.join(this.dirPath, 'timeline');
	}

	get tagTreePath() {
		return path.join(this.dirPath, 'tag-tree.json');
	}

	get settingsPath() {
		return path.join(this.dirPath, 'working-directory-settings.json');
	}

	get personasPath() {
		return path.join(this.dirPath, 'personas.json');
	}

	get savedProps() {
		return {
			gitSnapshotsEnabled: this.gitSnapshotsEnabled,
			gitRemoteUrl: this.gitRemoteUrl,
		};
	}

	overwrite() {
		writeObjectFile(this.settingsPath, this.savedProps);
	}
}
