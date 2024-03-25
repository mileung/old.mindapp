import { RequestHandler } from 'express';
import { RootSettings } from '../types/RootSettings';
import { defaultWorkspacePath, testWorkspacePath } from '../utils/files';

const getRootSettings: RequestHandler = (req, res) => {
	res.send({ ...RootSettings.get(), defaultWorkspacePath, testWorkspacePath });
};

export default getRootSettings;
