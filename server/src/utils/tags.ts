import TagTree from '../types/TagTree';
import { indicesPath, parseFile, tagTreePath, writeObjectFile } from './files';

export type Indices = Record<string, string[]>;

// export const aggregateSetArray = (...arrays: string[][]) => {
// 	return sortUniArr(arrays.flatMap((a) => a));
// };

export const sortUniArr = (a: string[]) => {
	return [...new Set(a)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
};

export const addTagsByLabel = (tags: string[]) => {
	const tagTree = parseFile<TagTree>(tagTreePath);
	tagTree.leafNodes = sortUniArr(
		tagTree.leafNodes.concat(tags.filter((tag) => !tagTree.branchNodes[tag])),
	);
	writeObjectFile(tagTreePath, tagTree);
};

export const addTagIndex = (tag: string, thoughtId: string) => {
	const indices = parseFile<Indices>(indicesPath);
	indices[tag] = indices[tag] || [];
	indices[tag] = sortUniArr([...indices[tag], thoughtId]);
	writeObjectFile(indicesPath, indices);
};

export const removeTagIndex = (tag: string, thoughtId: string) => {
	const indices = parseFile<Indices>(indicesPath);
	indices[tag] = indices[tag] || [];
	const tagIndex = indices[tag].indexOf(thoughtId);
	if (tagIndex !== -1) {
		indices[tag].splice(tagIndex, 1);
	}
	if (!indices[tag].length) {
		delete indices[tag];
	}
	writeObjectFile(indicesPath, indices);
};

export function sortObjectProps(obj: Record<string, any>) {
	Object.keys(obj)
		.sort()
		.forEach((key) => {
			const temp = obj[key];
			delete obj[key];
			obj[key] = temp;
		});
}
