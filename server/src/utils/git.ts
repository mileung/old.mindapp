import simpleGit from 'simple-git';
import { mindappRootPath } from './files';
import { Settings } from '../types/Settings';
import { debounce } from './performance';
import { minute } from './time';

const git = simpleGit(mindappRootPath);

export function setUpGit() {
	const { gitSnapshotsEnabled } = Settings.get();
	if (gitSnapshotsEnabled) {
		git.checkIsRepo((e, isRepo) => {
			if (e) return console.error('Error checking repository:', e);
			if (!isRepo) {
				git
					.init((e) => {
						if (e) return console.error('Error initializing repository:', e);
						console.log(`Repository initialized at ${mindappRootPath}`);
					})
					.checkoutLocalBranch('master');
			}
		});
	}
}

export const snapshot = () => {
	const { gitSnapshotsEnabled, gitRemoteUrl } = Settings.get();
	if (!gitSnapshotsEnabled) return;

	console.log('snapshot');
	git
		.add(['timeline', 'indices.json', 'settings.json', 'tags.json'])
		.commit(`Snapshot at ${Date.now()}`);

	if (!gitRemoteUrl) return;

	const remoteName = 'origin';
	const branchName = 'master';
	git.removeRemote(remoteName); // in case the url changes
	git.addRemote(remoteName, gitRemoteUrl).push(['-u', remoteName, branchName, '-f'], (error) => {
		if (error) {
			console.error('Error pushing to remote:', error);
		} else {
			console.log('Changes pushed to remote');
		}
	});
};

export const debouncedSnapshot = debounce(snapshot, minute);
