export type TagTree = {
	branchNodes: Record<string, string[]>;
	leafNodes: string[];
};

export type Tag = {
	label: string;
	parentTags: string[];
	subTags: string[];
};

export type RecursiveTag = {
	lineage: string[];
	label: string;
	subRecTags: null | RecursiveTag[];
};

export const sortUniArr = (a: string[]) => {
	return [...new Set(a)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
};

export function makeRootTag(tagTree: TagTree, label: string) {
	if (!tagTree.branchNodes[label]) return { label, lineage: [label], subRecTags: null };
	const leafNodes = new Set(tagTree.leafNodes);

	const expand = (label: string, lineage: string[] = []): RecursiveTag => {
		const tagSubLabels = tagTree.branchNodes[label];
		if (!tagSubLabels && !leafNodes.has(label)) throw new Error(`Tag "${label}" not found`);
		return {
			label,
			lineage: [...lineage, label],
			subRecTags:
				!tagSubLabels || lineage.includes(label)
					? null
					: tagSubLabels.map((subsetLabel) => expand(subsetLabel, [...lineage, label])),
		};
	};

	return expand(label);
}
