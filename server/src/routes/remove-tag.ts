import { RequestHandler } from 'express';
import { Tag } from '../types/Tag';
import { indicesPath, parseFile, tagsPath, writeFile } from '../utils/files';
import { debouncedSnapshot } from '../utils/git';

const removeTag: RequestHandler = (req, res) => {
	let tags = parseFile<Tag[]>(tagsPath);

	const { tagLabel, parentLabel } = req.body;

	const tagIndex = tags.findIndex((tag) => tag.label === tagLabel);
	if (tagIndex === -1) throw new Error('tagLabel Tag dne');

	if (parentLabel) {
		const parentLabelIndex = tags[tagIndex].parentLabels.findIndex((l) => l === parentLabel);
		if (parentLabelIndex === -1) throw new Error('parentLabel dne in tag parentLabels');
		tags[tagIndex].parentLabels.splice(parentLabelIndex, 1);

		const parentTagIndex = tags.findIndex((tag) => tag.label === parentLabel);
		if (parentTagIndex === -1) throw new Error('parentLabel Tag dne');
		const subLabelIndex = tags[parentTagIndex].subLabels.findIndex((label) => label === tagLabel);
		if (subLabelIndex === -1) throw new Error('tagLabel Tag dne in parent subLabels');
		tags[parentTagIndex].subLabels.splice(subLabelIndex, 1);
	} else {
		tags.splice(tagIndex, 1);
		tags.forEach((tag) => {
			tag.parentLabels = tag.parentLabels.filter((label) => label !== tagLabel);
			tag.subLabels = tag.subLabels.filter((label) => label !== tagLabel);
		});
	}

	writeFile(tagsPath, JSON.stringify(tags));
	if (!parentLabel) {
		const indices = parseFile<Record<string, string[]>>(indicesPath);
		delete indices[tagLabel];
		writeFile(indicesPath, JSON.stringify(indices));
	}

	res.send({});
	debouncedSnapshot();
};

export default removeTag;
