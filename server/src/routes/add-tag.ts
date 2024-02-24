import { RequestHandler } from 'express';
import { Tag } from '../types/Tag';
import { parseFile, tagsPath, writeFile } from '../utils/files';
import { debouncedSnapshot } from '../utils/git';
import { sortUniArr } from '../utils/tags';

const addTag: RequestHandler = (req, res) => {
	const parentLabel = (req.body.parentLabel || '').trim();
	const newTag = new Tag({
		label: req.body.label.trim(),
		parentLabels: parentLabel ? [parentLabel] : [],
	});
	const tags = parseFile<Tag[]>(tagsPath);

	const parentTagIndex = tags.findIndex((tag) => tag.label === parentLabel);
	if (parentTagIndex !== -1) {
		tags[parentTagIndex].subLabels = sortUniArr(
			tags[parentTagIndex].subLabels.concat(newTag.label),
		);
	}

	const existingTagIndex = tags.findIndex((tag) => tag.label === newTag.label);
	if (existingTagIndex !== -1) {
		tags[existingTagIndex].parentLabels = sortUniArr(
			tags[existingTagIndex].parentLabels.concat(newTag.parentLabels),
		);
	} else {
		tags.push(newTag);
		tags.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
	}

	writeFile(tagsPath, JSON.stringify(tags));

	res.send({});
	debouncedSnapshot();
};

export default addTag;
