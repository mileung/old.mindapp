import { RequestHandler } from 'express';
import { Settings } from '../types/Settings';

const getSettings: RequestHandler = (req, res) => {
	res.send(Settings.get());
};

export default getSettings;
