import { RequestHandler } from 'express';
import { RootSettings } from '../types/RootSettings';
import { Workspace } from '../types/Workspace';
import { defaultWorkspacePath, testWorkspacePath } from '../utils/files';

const updateRootSettings: RequestHandler = (req, res) => {
	const rootSettings = RootSettings.get();
	const newRootSettings = new RootSettings({ ...rootSettings, ...req.body });
	newRootSettings.overwrite();
	if (rootSettings.usingDefaultWorkspacePath !== newRootSettings.usingDefaultWorkspacePath) {
		Workspace.current.setUp();
	}
	res.send({ ...newRootSettings, defaultWorkspacePath, testWorkspacePath });
};

export default updateRootSettings;
