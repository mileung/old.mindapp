import { RequestHandler } from 'express';
import { parseFile } from '../utils/files';
import TagTree from '../types/TagTree';
import { Workspace } from '../types/Workspace';

const getTagTree: RequestHandler = (req, res) => {
	const tagTree = parseFile<TagTree>(Workspace.current.tagTreePath);
	res.send(tagTree);
};

export default getTagTree;
