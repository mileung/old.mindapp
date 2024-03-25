import { RequestHandler } from 'express';
import { Workspace } from '../types/Workspace';

const getWorkspace: RequestHandler = (req, res) => {
	res.send(Workspace.current);
};

export default getWorkspace;
