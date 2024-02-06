import { RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { spacesPath } from '../utils/files';
import { Tag } from '../types/Tag';

const addTag: RequestHandler = (req, res) => {
	const spaceId = 'localhost';
	console.log('req.body:', req.body);
	const newTag = new Tag(req.body.label.trim(), req.body.parentTags);
	const tagsPath = path.join(spacesPath, spaceId, 'tags.json');
	let tags: Tag[] = JSON.parse(fs.readFileSync(tagsPath).toString());

	const existingTagIndex = tags.findIndex((tag) => tag.label === newTag.label);
	let subTagsSet = new Set(newTag.subTags);
	let parentTagsSet = new Set(newTag.parentTags);

	if (existingTagIndex !== -1) {
		// Update existing tag with newTag information
		const existingTag = tags[existingTagIndex];
		existingTag.parentTags = [...new Set(existingTag.parentTags.concat(newTag.parentTags))].sort(
			(a, b) => a.toLowerCase().localeCompare(b.toLowerCase())
		);
		existingTag.subTags = [...new Set(existingTag.subTags.concat(newTag.subTags))].sort((a, b) =>
			a.toLowerCase().localeCompare(b.toLowerCase())
		);
		parentTagsSet = new Set(existingTag.parentTags);
		subTagsSet = new Set(existingTag.subTags);
	} else {
		// If the label doesn't exist, add newTag to tags
		tags.push(newTag);
		tags.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
	}

	// Update subTags and parentTags for other tags
	tags.forEach((tag) => {
		if (tag.label !== newTag.label) {
			if (parentTagsSet.has(tag.label)) {
				tag.subTags = [...new Set([...tag.subTags, newTag.label])].sort((a, b) =>
					a.toLowerCase().localeCompare(b.toLowerCase())
				);
			}
			if (subTagsSet.has(tag.label)) {
				tag.parentTags = [...new Set([...tag.parentTags, newTag.label])].sort((a, b) =>
					a.toLowerCase().localeCompare(b.toLowerCase())
				);
			}
		}
	});

	// Write the updated tags array back to the file
	fs.writeFileSync(tagsPath, JSON.stringify(tags));

	res.send({});
};

export default addTag;
