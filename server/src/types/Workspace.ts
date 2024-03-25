import path from 'path';
import simpleGit from 'simple-git';
import { setUpIndex } from '../utils';
import {
	defaultWorkspacePath,
	mkdirIfDne,
	parseFile,
	testWorkspacePath,
	touchIfDne,
	writeObjectFile,
} from '../utils/files';
import { RootSettings } from './RootSettings';
import TagTree from './TagTree';

export class Workspace {
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
	}

	static get current() {
		const rootSettings = RootSettings.get();
		const dirPath = rootSettings.usingDefaultWorkspacePath
			? defaultWorkspacePath
			: testWorkspacePath;
		const newWorkspace = new Workspace({ dirPath });
		try {
			const settings = parseFile<Workspace>(newWorkspace.settingsPath);
			return new Workspace({ ...settings, dirPath });
		} catch (error) {
			return newWorkspace;
		}
	}

	setUp() {
		setUpIndex();
		mkdirIfDne(this.dirPath);
		mkdirIfDne(this.timelinePath);
		touchIfDne(this.tagTreePath, JSON.stringify(new TagTree({ parents: {}, loners: [] })));
		touchIfDne(this.settingsPath, JSON.stringify(this.criticalProps));
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
		return path.join(this.dirPath, 'workspace-settings.json');
	}

	get criticalProps() {
		return {
			gitSnapshotsEnabled: this.gitSnapshotsEnabled,
			gitRemoteUrl: this.gitRemoteUrl,
		};
	}
	overwrite() {
		writeObjectFile(this.settingsPath, this.criticalProps);
	}
}
