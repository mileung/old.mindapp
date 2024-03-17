import TagTree from '../types/TagTree';
import { parseFile, tagTreePath, writeObjectFile } from './files';

export type Indices = Record<string, string[]>;

// export const aggregateSetArray = (...arrays: string[][]) => {
// 	return sortUniArr(arrays.flatMap((a) => a));
// };

export const sortUniArr = (a: string[]) => {
	return [...new Set(a)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
};

export const addTagsByLabel = (tags: string[]) => {
	const tagTree = parseFile<TagTree>(tagTreePath);
	const tagsWithRelatives = new Set<string>();
	Object.entries(tagTree.parents).forEach(([parent, children]) => {
		tagsWithRelatives.add(parent);
		children.forEach((child) => tagsWithRelatives.add(child));
	});
	tagTree.loners = sortUniArr(
		tagTree.loners.concat(
			tags.map((t) => t.trim()).filter((tag) => tag && !tagsWithRelatives.has(tag)),
		),
	);
	writeObjectFile(tagTreePath, tagTree);
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

export function shouldBeLoner(tagTree: TagTree, tag: string) {
	return (
		!tagTree.parents[tag] &&
		-1 ===
			Object.values(tagTree.parents).findIndex((subtags) => {
				return subtags.includes(tag);
			})
	);
}
