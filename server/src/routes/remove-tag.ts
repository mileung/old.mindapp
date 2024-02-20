import { RequestHandler } from 'express';
import fs from 'fs';
import { Tag } from '../types/Tag';
import { parseFile, tagsPath } from '../utils/files';
import { debouncedSnapshot } from '../utils/git';

const removeTag: RequestHandler = (req, res) => {
	let tags = parseFile<Tag[]>(tagsPath);

	const { currentTagLabel, parentLabel } = req.body;
	console.log('currentTagLabel:', currentTagLabel);
	console.log('parentLabel:', parentLabel);

	if (parentLabel) {
		const parentTagsIndex = tags.findIndex((tag) => tag.label === parentLabel);
		if (parentTagsIndex !== -1) {
			const subLabelsIndex = tags[parentTagsIndex].subLabels.findIndex(
				(subLabel) => subLabel !== currentTagLabel,
			);
			if (subLabelsIndex !== -1) {
				tags[parentTagsIndex].subLabels.splice(subLabelsIndex, 1);
			}
		}
		const currentTagsIndex = tags.findIndex((tag) => tag.label === currentTagLabel);
		if (currentTagsIndex !== -1) {
			const parentLabelsIndex = tags[currentTagsIndex].parentLabels.findIndex(
				(subLabel) => subLabel !== currentTagLabel,
			);
			if (parentLabelsIndex !== -1) {
				tags[currentTagsIndex].parentLabels.splice(parentLabelsIndex, 1);
			}
		}
	} else {
		const currentTagsIndex = tags.findIndex((tag) => tag.label === currentTagLabel);
		// const rootTag = tags.splice(currentTagsIndex, 1);
		tags.splice(currentTagsIndex, 1);
		tags.forEach((tag) => {
			tag.parentLabels = tag.parentLabels.filter((parentLabel) => parentLabel !== currentTagLabel);
			tag.subLabels = tag.subLabels.filter((subLabel) => subLabel !== currentTagLabel);
		});
	}

	// Rewrite tags.json with the updated tags
	fs.writeFileSync(tagsPath, JSON.stringify(tags));

	res.send({});
	debouncedSnapshot();
};

export default removeTag;
