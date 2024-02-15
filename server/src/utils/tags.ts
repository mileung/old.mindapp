import { Tag } from '../types/Tag';
import { indicesPath, parseFile, tagsPath, writeFile } from './files';

export type Indices = Record<string, string[]>;

export const aggregateSetArray = (...arrays: string[][]) => {
	return makeSortedUniqueArr(arrays.flatMap((a) => a));
};

export const makeSortedUniqueArr = (a: string[]) => {
	return [...new Set(a)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
};

export const addTags = (labels: string[]) => {
	const tags = parseFile<Tag[]>(tagsPath);
	const tagLabelsSet = new Set(tags.map(({ label }) => label));
	for (let i = 0; i < labels.length; i++) {
		const label = labels[i];
		if (!tagLabelsSet.has(label)) {
			tags.push(new Tag(label));
		}
	}
	tags.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
	writeFile(tagsPath, JSON.stringify(tags));
};

export const addTagIndex = (label: string, thoughtId: string) => {
	const indices = parseFile<Indices>(indicesPath);
	indices[label] = indices[label] || [];
	indices[label] = makeSortedUniqueArr([...indices[label], thoughtId]);
	writeFile(indicesPath, JSON.stringify(indices));
};

export const removeTagIndex = (label: string, thoughtId: string) => {
	const indices = parseFile<Indices>(indicesPath);
	indices[label] = indices[label] || [];
	const labelIndex = indices[label].indexOf(thoughtId);
	if (labelIndex !== -1) {
		indices[label].splice(labelIndex, 1);
	}
	if (!indices[label].length) {
		delete indices[label];
	}
	writeFile(indicesPath, JSON.stringify(indices));
};
