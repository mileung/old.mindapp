import { RequestHandler } from 'express';
import { Tag } from '../types/Tag';
import { indicesPath, parseFile, tagsPath, writeObjectFile } from '../utils/files';
import { sortUniArr } from '../utils/tags';
import { debouncedSnapshot } from '../utils/git';
import { Thought } from '../types/Thought';

const renameTag: RequestHandler = (req, res) => {
	const oldLabel = req.body.oldLabel.trim();
	const newLabel = req.body.newLabel.trim();
	if (oldLabel === newLabel) throw new Error('New tag label is the same as the old one');

	const tags = parseFile<Tag[]>(tagsPath);
	// I get that this could be optimized into 1 for loop but don't do that until it's actually slow for the user
	const oldTagIndex = tags.findIndex((tag) => tag.label === oldLabel);
	const newTagIndex = tags.findIndex((tag) => tag.label === newLabel);
	if (oldTagIndex === -1) throw new Error('Tag with oldLabel does not exist');

	const oldTag = new Tag(tags[oldTagIndex]);
	const newTag = new Tag(newTagIndex === -1 ? { label: newLabel } : tags[newTagIndex]);

	if (newTagIndex === -1) {
		tags[oldTagIndex].label = newLabel;
	} else {
		tags[newTagIndex].label = newLabel;
		tags[newTagIndex].subLabels = sortUniArr(oldTag.subLabels.concat(newTag.subLabels));
		tags[newTagIndex].parentLabels = sortUniArr(oldTag.parentLabels.concat(newTag.parentLabels));
		if (!oldTag.parentLabels.length) tags.splice(oldTagIndex, 1);
	}

	tags.forEach((tag) => {
		tag.subLabels = tag.subLabels.map((label) => (label === oldLabel ? newLabel : label));
		tag.parentLabels = tag.parentLabels.map((label) => (label === oldLabel ? newLabel : label));
	});

	tags.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

	// Write the updated tags array back to the file
	writeObjectFile(tagsPath, tags);

	const indices = parseFile<Record<string, string[]>>(indicesPath);

	indices[oldLabel].forEach((id) => {
		const thought = Thought.parse(id);
		thought.tagLabels = sortUniArr(
			thought.tagLabels.filter((label) => label !== oldLabel).concat(newLabel),
		);
		thought.overwrite();
	});

	if (indices[newLabel]) {
		indices[newLabel] = sortUniArr(indices[newLabel].concat(indices[oldLabel]));
	} else {
		indices[newLabel] = [...(indices[oldLabel] || [])];
	}
	delete indices[oldLabel];
	writeObjectFile(indicesPath, indices);

	res.send({});
	debouncedSnapshot();
};

export default renameTag;
