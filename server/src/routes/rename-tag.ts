import { RequestHandler } from 'express';
import TagTree from '../types/TagTree';
import { parseFile, tagTreePath, writeObjectFile } from '../utils/files';
import { sortObjectProps, sortUniArr } from '../utils/tags';
import { debouncedSnapshot } from '../utils/git';
import { Thought } from '../types/Thought';
import { index } from '../utils';

const renameTag: RequestHandler = (req, res) => {
	const oldTag: string = req.body.oldTag;
	const newTag: string = req.body.newTag.trim();
	if (oldTag === newTag) return res.send({});
	const tagTree = parseFile<TagTree>(tagTreePath);

	if (tagTree.branchNodes[oldTag]) {
		tagTree.branchNodes[newTag] = tagTree.branchNodes[oldTag];
		delete tagTree.branchNodes[oldTag];
	} else {
		const oldTagIndex = tagTree.leafNodes.findIndex((label) => label === oldTag);
		if (oldTagIndex === -1) throw new Error(`oldTag "${oldTag}" dne`);
		tagTree.leafNodes.splice(oldTagIndex, 1, newTag);
		tagTree.leafNodes = sortUniArr(tagTree.leafNodes);
	}

	Object.entries(tagTree.branchNodes).forEach(([tag, subtags]) => {
		const oldTagIndex = subtags.findIndex((label) => label === oldTag);
		if (oldTagIndex !== -1) {
			subtags.splice(oldTagIndex, 1);
			tagTree.branchNodes[tag] = sortUniArr(subtags.concat(newTag));
		}
	});

	sortObjectProps(tagTree.branchNodes);
	writeObjectFile(tagTreePath, tagTree);

	(index.thoughtPathsByTag[oldTag] || []).forEach((id) => {
		const thought = Thought.read(id);
		thought.tags = sortUniArr(thought.tags.filter((tag) => tag !== oldTag).concat(newTag));
		thought.overwrite();
	});

	if (index.thoughtPathsByTag[newTag]) {
		index.thoughtPathsByTag[newTag] = sortUniArr(
			index.thoughtPathsByTag[newTag].concat(index.thoughtPathsByTag[oldTag]),
		);
	} else if (index.thoughtPathsByTag[oldTag]) {
		index.thoughtPathsByTag[newTag] = index.thoughtPathsByTag[oldTag];
	}
	delete index.thoughtPathsByTag[oldTag];

	res.send({});
	debouncedSnapshot();
};

export default renameTag;
