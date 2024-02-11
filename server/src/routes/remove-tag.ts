import { RequestHandler } from 'express';
import fs from 'fs';
import { Tag } from '../types/Tag';
import { parseFile, tagsPath } from '../utils/files';

const removeTag: RequestHandler = (req, res) => {
	const spaceId = null;
	const tags = parseFile<Tag[]>(tagsPath);

	const { currentTagLabel, parentLabel } = req.body;

	if (parentLabel) {
		// Remove the currentTagLabel from the subLabels of the parentLabel
		const parentTag = tags.find((tag) => tag.label === parentLabel);
		const currentTag = tags.find((tag) => tag.label === currentTagLabel);
		if (parentTag) {
			parentTag.subLabels = parentTag.subLabels.filter((subLabel) => subLabel !== currentTagLabel);
		}
		if (currentTag) {
			currentTag.parentLabels = currentTag.parentLabels.filter(
				(subLabel) => subLabel !== currentTagLabel
			);
		}
	} else {
		// Remove all occurrences of currentTagLabel from tags
		tags
			.filter((tag) => tag.label !== currentTagLabel)
			.forEach((tag) => {
				tag.parentLabels = tag.parentLabels.filter(
					(parentLabel) => parentLabel !== currentTagLabel
				);
				tag.subLabels = tag.subLabels.filter((subLabel) => subLabel !== currentTagLabel);
			});
	}

	// Rewrite tags.json with the updated tags
	fs.writeFileSync(tagsPath, JSON.stringify(tags));

	res.send({});
};

export default removeTag;
