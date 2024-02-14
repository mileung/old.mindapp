import { RequestHandler } from 'express';
import fs from 'fs';
import { Tag } from '../types/Tag';
import { parseFile, tagsPath } from '../utils/files';
import { aggregateSetArray } from '../utils/tags';

const addTag: RequestHandler = (req, res) => {
	// console.log('req.body:', req.body);
	const newTag = new Tag(req.body.label.trim(), req.body.parentLabels);
	const tags = parseFile<Tag[]>(tagsPath);

	const existingTagIndex = tags.findIndex((tag) => tag.label === newTag.label);
	let subLabelsSet = new Set(newTag.subLabels);
	let parentLabelsSet = new Set(newTag.parentLabels);

	if (existingTagIndex !== -1) {
		// Update existing tag with newTag information
		const existingTag = tags[existingTagIndex];
		existingTag.parentLabels = aggregateSetArray(
			existingTag.parentLabels,
			newTag.parentLabels,
		).filter((label) => label !== existingTag.label);
		existingTag.subLabels = aggregateSetArray(existingTag.subLabels, newTag.subLabels).filter(
			(label) => label !== existingTag.label,
		);
		parentLabelsSet = new Set(existingTag.parentLabels);
		subLabelsSet = new Set(existingTag.subLabels);
	} else {
		// If the label doesn't exist, add newTag to tags
		tags.push(newTag);
		tags.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
	}

	// Update subLabels and parentLabels for other tags
	tags.forEach((tag) => {
		if (tag.label !== newTag.label) {
			if (parentLabelsSet.has(tag.label)) {
				tag.subLabels = aggregateSetArray(tag.subLabels, [newTag.label]);
			}
			if (subLabelsSet.has(tag.label)) {
				tag.parentLabels = aggregateSetArray(tag.parentLabels, [newTag.label]);
			}
		}
	});

	// Write the updated tags array back to the file
	fs.writeFileSync(tagsPath, JSON.stringify(tags));

	res.send({});
};

export default addTag;
