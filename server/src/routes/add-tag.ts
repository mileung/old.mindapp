import { RequestHandler } from 'express';
import TagTree from '../types/TagTree';
import { parseFile, tagTreePath, writeObjectFile } from '../utils/files';
import { debouncedSnapshot } from '../utils/git';
import { sortObjectProps, sortUniArr } from '../utils/tags';

const addTag: RequestHandler = (req, res) => {
	const tagTree = parseFile<TagTree>(tagTreePath);
	const parentTag = (req.body.parentTag || '').trim();
	const tag = (req.body.tag || '').trim();

	if (parentTag) {
		if (tagTree.branchNodes[parentTag]) {
			tagTree.branchNodes[parentTag] = sortUniArr(tagTree.branchNodes[parentTag].concat(tag));
		} else {
			const parentTagIndex = tagTree.leafNodes.findIndex((tag) => tag === parentTag);
			if (parentTagIndex === -1) throw new Error(`Parent tag "${parentTag}" dne`);
			tagTree.leafNodes.splice(parentTagIndex, 1);
			tagTree.branchNodes[parentTag] = [tag];
		}
	}
	if (!tagTree.branchNodes[tag]) {
		tagTree.leafNodes = sortUniArr(tagTree.leafNodes.concat(tag));
	}
	sortObjectProps(tagTree.branchNodes);
	writeObjectFile(tagTreePath, tagTree);
	res.send({});
	debouncedSnapshot();
};

export default addTag;
