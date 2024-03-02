import { Tag } from '../types/Tag';
import { indicesPath, parseFile, tagsPath, writeObjectFile } from './files';

export type Indices = Record<string, string[]>;

// export const aggregateSetArray = (...arrays: string[][]) => {
// 	return sortUniArr(arrays.flatMap((a) => a));
// };

export const sortUniArr = (a: string[]) => {
	return [...new Set(a)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
};

export const addTagsByLabel = (labels: string[]) => {
	const tags = parseFile<Tag[]>(tagsPath);
	const tagLabelsSet = new Set(tags.map(({ label }) => label));
	for (let i = 0; i < labels.length; i++) {
		const label = labels[i];
		if (!tagLabelsSet.has(label)) {
			tags.push(new Tag({ label }));
		}
	}
	tags.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
	writeObjectFile(tagsPath, tags);
};

export const addTagIndex = (label: string, thoughtId: string) => {
	const indices = parseFile<Indices>(indicesPath);
	indices[label] = indices[label] || [];
	indices[label] = sortUniArr([...indices[label], thoughtId]);
	writeObjectFile(indicesPath, indices);
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
	writeObjectFile(indicesPath, indices);
};
