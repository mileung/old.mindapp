import { RequestHandler } from 'express';
import { Settings } from '../types/Settings';
import { debouncedSnapshot } from '../utils/git';

const updateSettings: RequestHandler = (req, res) => {
	const settings = Settings.get();
	Object.assign(settings, req.body);
	settings.overwrite();
	res.send({});
	debouncedSnapshot();
};

export default updateSettings;
