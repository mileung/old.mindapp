import child_process from 'child_process';
import { RequestHandler } from 'express';
import { RootSettings } from '../types/RootSettings';
import { defaultWorkspacePath, testWorkspacePath } from '../utils/files';

const showCurrentWorkspace: RequestHandler = (req, res) => {
	const rootSettings = RootSettings.get();
	const dirPath = rootSettings.usingDefaultWorkspacePath ? defaultWorkspacePath : testWorkspacePath;
	dirPath && dirOpen(dirPath);
	res.send({});
};

export default showCurrentWorkspace;

function dirOpen(dirPath: string) {
	let command = '';
	switch (process.platform) {
		case 'darwin':
			command = 'open';
			break;
		case 'win32':
			command = 'explorer';
			break;
		default:
			command = 'xdg-open';
			break;
	}
	console.log('child_process.execSync', `${command} "${dirPath}"`);
	return child_process.execSync(`${command} "${dirPath}"`);
}
