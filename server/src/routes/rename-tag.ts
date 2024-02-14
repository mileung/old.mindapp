import { RequestHandler } from 'express';
import fs from 'fs';
import { Tag } from '../types/Tag';
import { parseFile, tagsPath } from '../utils/files';
import { aggregateSetArray } from '../utils/tags';

const renameTag: RequestHandler = (req, res) => {
	// console.log('req.body:', req.body);
	let oldTag = new Tag(req.body.oldLabel.trim());
	const newTag = new Tag(req.body.newLabel.trim());

	if (oldTag.label !== newTag.label) {
		const tags = parseFile<Tag[]>(tagsPath);
		// I get that this could be optimized into 1 for loop but don't do that until it's actually slow for the user
		const oldTagIndex = tags.findIndex((tag) => tag.label === oldTag.label);
		const newTagIndex = tags.findIndex((tag) => tag.label === newTag.label);

		if (oldTagIndex === -1) {
			throw new Error('Tag with oldLabel does not exist');
		}

		if (newTagIndex !== -1) {
			// tag with that label already exists
			tags[newTagIndex].subLabels = aggregateSetArray(
				tags[newTagIndex].subLabels,
				tags[oldTagIndex].subLabels,
			).filter((label) => label !== oldTag.label || label !== newTag.label);
			tags[newTagIndex].parentLabels = aggregateSetArray(
				tags[newTagIndex].parentLabels,
				tags[oldTagIndex].parentLabels,
			).filter((label) => label !== oldTag.label || label !== newTag.label);
		} else {
			oldTag = new Tag(
				tags[oldTagIndex].label,
				tags[oldTagIndex].parentLabels,
				tags[oldTagIndex].subLabels,
			);
		}

		// Update subLabels and parentLabels for other tags
		tags.forEach((tag) => {
			if (tag.label === oldTag.label) tag.label = newTag.label;
			tag.subLabels = tag.subLabels.map((label) => (label === oldTag.label ? newTag.label : label));
			tag.parentLabels = tag.parentLabels.map((label) =>
				label === oldTag.label ? newTag.label : label,
			);
		});

		if (newTagIndex !== -1 && !tags[oldTagIndex].parentLabels.length) {
			tags.splice(oldTagIndex, 1);
		}

		// Write the updated tags array back to the file
		fs.writeFileSync(tagsPath, JSON.stringify(tags));
	}

	res.send({});
};

export default renameTag;
