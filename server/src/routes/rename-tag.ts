import { RequestHandler } from 'express';
import TagTree from '../types/TagTree';
import { sortObjectProps, sortUniArr } from '../utils/tags';
import { Thought } from '../types/Thought';
import { index } from '../utils';
import { debouncedSnapshot } from '../utils/git';

const renameTag: RequestHandler = (req, res) => {
	const oldTag: string = req.body.oldTag;
	const newTag: string = req.body.newTag.trim();
	if (oldTag === newTag) return res.send({});
	const tagTree = TagTree.get();
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
	tagTree.overwrite();

	(index.thoughtIdsByTag[oldTag] || []).forEach((thoughtIds) => {
		const thought = Thought.read(thoughtIds);
		const oldTagIndex = thought.tags.indexOf(oldTag);
		if (oldTagIndex === -1) throw new Error(`Index for tag "${oldTag}" has misplaced thought`);
		thought.tags[oldTagIndex] = newTag;
		thought.tags = sortUniArr(thought.tags);
		thought.overwrite();
	});
	if (index.thoughtIdsByTag[newTag]) {
		index.thoughtIdsByTag[newTag] = sortUniArr(
			index.thoughtIdsByTag[newTag]!.concat(index.thoughtIdsByTag[oldTag] || []), // Is the ]!. a bug in TypeScript?
		);
	} else if (index.thoughtIdsByTag[oldTag]) {
		index.thoughtIdsByTag[newTag] = index.thoughtIdsByTag[oldTag];
	}
	delete index.thoughtIdsByTag[oldTag];

	res.send({});
	debouncedSnapshot();
};

export default renameTag;
