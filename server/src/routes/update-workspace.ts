import { RequestHandler } from 'express';
import { Workspace } from '../types/Workspace';
import { debouncedSnapshot } from '../utils/git';

const updateWorkspace: RequestHandler = (req, res) => {
	const updatedWorkspace = new Workspace({ ...Workspace.current, ...req.body });
	updatedWorkspace.overwrite();
	res.send(updatedWorkspace);
	debouncedSnapshot();
};

export default updateWorkspace;
