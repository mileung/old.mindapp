import { RequestHandler } from 'express';
import { parseFile, settingsPath } from '../utils/files';
import { Settings } from '../types/Settings';

const getSettings: RequestHandler = (req, res) => {
	res.send(parseFile<Settings>(settingsPath));
};

export default getSettings;
