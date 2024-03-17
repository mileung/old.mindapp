import { RequestHandler } from 'express';
import TagTree from '../types/TagTree';
import { parseFile, tagTreePath, writeObjectFile } from '../utils/files';
import { debouncedSnapshot } from '../utils/git';
import { shouldBeLoner, sortObjectProps, sortUniArr } from '../utils/tags';

const addTag: RequestHandler = (req, res) => {
	const tagTree = parseFile<TagTree>(tagTreePath);
	const tag = (req.body.tag || '').trim();
	const parentTag = (req.body.parentTag || '').trim();
	if (tag) {
		if (parentTag) {
			tagTree.parents[parentTag] = !tagTree.parents[parentTag]
				? [tag]
				: sortUniArr(tagTree.parents[parentTag].concat(tag));
			const parentTagIndex = tagTree.loners.indexOf(parentTag);
			parentTagIndex !== -1 && tagTree.loners.splice(parentTagIndex, 1);
			const tagIndex = tagTree.loners.indexOf(tag);
			tagIndex !== -1 && tagTree.loners.splice(tagIndex, 1);
		} else if (shouldBeLoner(tagTree, tag)) {
			tagTree.loners = sortUniArr(tagTree.loners.concat(tag));
		}
	}
	sortObjectProps(tagTree.parents);
	writeObjectFile(tagTreePath, tagTree);
	res.send({});
	debouncedSnapshot();
};

export default addTag;
