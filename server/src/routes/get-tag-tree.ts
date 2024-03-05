import { RequestHandler } from 'express';
import { parseFile, tagTreePath, touchIfDne } from '../utils/files';
import TagTree from '../types/TagTree';

const getTagTree: RequestHandler = (req, res) => {
	touchIfDne(tagTreePath, JSON.stringify(new TagTree({ branchNodes: {}, leafNodes: [] })));
	const tagTree = parseFile<TagTree>(tagTreePath);
	res.send(tagTree);
};

export default getTagTree;
