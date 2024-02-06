import { RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { spacesPath } from '../utils/files';
import { Tag } from '../types/Tag';
import { makeSetArr } from '../utils/tags';

const addTag: RequestHandler = (req, res) => {
	const spaceId = 'localhost';
	// console.log('req.body:', req.body);
	const newTag = new Tag(req.body.label.trim(), req.body.parentLabels);
	const tagsPath = path.join(spacesPath, spaceId, 'tags.json');
	const tags: Tag[] = JSON.parse(fs.readFileSync(tagsPath).toString());

	const existingTagIndex = tags.findIndex((tag) => tag.label === newTag.label);
	let subLabelsSet = new Set(newTag.subLabels);
	let parentLabelsSet = new Set(newTag.parentLabels);

	if (existingTagIndex !== -1) {
		// Update existing tag with newTag information
		const existingTag = tags[existingTagIndex];
		existingTag.parentLabels = makeSetArr(existingTag.parentLabels, newTag.parentLabels).filter(
			(label) => label !== existingTag.label
		);
		existingTag.subLabels = makeSetArr(existingTag.subLabels, newTag.subLabels).filter(
			(label) => label !== existingTag.label
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
				tag.subLabels = makeSetArr(tag.subLabels, [newTag.label]);
			}
			if (subLabelsSet.has(tag.label)) {
				tag.parentLabels = makeSetArr(tag.parentLabels, [newTag.label]);
			}
		}
	});

	// Write the updated tags array back to the file
	fs.writeFileSync(tagsPath, JSON.stringify(tags));

	res.send({});
};

export default addTag;
