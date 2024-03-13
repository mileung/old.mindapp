import { RequestHandler } from 'express';
import TagTree from '../types/TagTree';
import { parseFile, tagTreePath, writeObjectFile } from '../utils/files';
import { debouncedSnapshot } from '../utils/git';
import { sortUniArr } from '../utils/tags';

const removeTag: RequestHandler = (req, res) => {
	const tagTree = parseFile<TagTree>(tagTreePath);
	const { tag, parentTag } = req.body as { tag: string; parentTag: string };

	if (parentTag && tag) {
		if (!tagTree.branchNodes[parentTag]) throw new Error(`parentTag "${parentTag}" dne`);
		const tagIndex = tagTree.branchNodes[parentTag].findIndex((l) => l === tag);
		if (tagIndex === -1) throw new Error(`tag "${tag}" isn't a subtag of "${parentTag}"`);
		tagTree.branchNodes[parentTag].splice(tagIndex, 1);
		if (!tagTree.branchNodes[parentTag].length) {
			delete tagTree.branchNodes[parentTag];
			tagTree.leafNodes = sortUniArr(tagTree.leafNodes.concat(parentTag));
		}
	} else if (tag) {
		if (tagTree.branchNodes[tag]) {
			delete tagTree.branchNodes[tag];
		} else {
			const tagIndex = tagTree.leafNodes.findIndex((label) => label === tag);
			if (tagIndex === -1) throw new Error(`tag "${tag}" dne`);
			tagTree.leafNodes.splice(tagIndex, 1);
		}
		Object.entries(tagTree.branchNodes).forEach(([otherParentTag, subtags]) => {
			const tagIndex = subtags.findIndex((label) => label === tag);
			if (tagIndex !== -1) subtags.splice(tagIndex, 1);
			if (!subtags.length) {
				delete tagTree.branchNodes[otherParentTag];
				tagTree.leafNodes = sortUniArr(tagTree.leafNodes.concat(otherParentTag));
			}
		});
		// When you remove a root tag from the tags page, it does and should not remove the tag from
		// every thought that has that tag.
		// delete index.thoughtPathsByTag[tag];
	}

	writeObjectFile(tagTreePath, tagTree);
	res.send({});
	debouncedSnapshot();
};

export default removeTag;
