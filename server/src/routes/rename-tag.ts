import { RequestHandler } from 'express';
import TagTree from '../types/TagTree';
import { parseFile, writeObjectFile } from '../utils/files';
import { sortObjectProps, sortUniArr } from '../utils/tags';
import { Thought } from '../types/Thought';
import { index } from '../utils';
import { Workspace } from '../types/Workspace';
import { debouncedSnapshot } from '../utils/git';

const renameTag: RequestHandler = (req, res) => {
	const oldTag: string = req.body.oldTag;
	const newTag: string = req.body.newTag.trim();
	const cw = Workspace.current;
	if (oldTag === newTag) return res.send({});
	const tagTree = parseFile<TagTree>(cw.tagTreePath);
	if (tagTree.parents[oldTag]) {
		tagTree.parents[newTag] = tagTree.parents[oldTag];
		delete tagTree.parents[oldTag];
	} else {
		const oldTagIndex = tagTree.loners.findIndex((label) => label === oldTag);
		if (oldTagIndex !== -1) {
			const willBeParent = !!tagTree.parents[newTag];
			if (willBeParent) {
				tagTree.loners.splice(oldTagIndex, 1);
			} else {
				tagTree.loners[oldTagIndex] = newTag;
				tagTree.loners = sortUniArr(tagTree.loners);
			}
		}
	}

	Object.entries(tagTree.parents).forEach(([tag, subtags]) => {
		const oldTagIndex = subtags.findIndex((label) => label === oldTag);
		if (oldTagIndex !== -1) {
			subtags[oldTagIndex] = newTag;
			tagTree.parents[tag] = sortUniArr(subtags);
		}
	});

	sortObjectProps(tagTree.parents);
	writeObjectFile(cw.tagTreePath, tagTree);

	(index.thoughtPathsByTag[oldTag] || []).forEach((id) => {
		const thought = Thought.read(id);
		const oldTagIndex = thought.tags.indexOf(oldTag);
		if (oldTagIndex === -1) throw new Error(`Index for tag "${oldTag}" has misplaced thought`);
		thought.tags[oldTagIndex] = newTag;
		thought.tags = sortUniArr(thought.tags);
		thought.overwrite();
	});
	if (index.thoughtPathsByTag[newTag]) {
		index.thoughtPathsByTag[newTag] = sortUniArr(
			index.thoughtPathsByTag[newTag]!.concat(index.thoughtPathsByTag[oldTag] || []), // Is the ]!. a bug in TypeScript?
		);
	} else if (index.thoughtPathsByTag[oldTag]) {
		index.thoughtPathsByTag[newTag] = index.thoughtPathsByTag[oldTag];
	}
	delete index.thoughtPathsByTag[oldTag];

	res.send({});
	debouncedSnapshot();
};

export default renameTag;
