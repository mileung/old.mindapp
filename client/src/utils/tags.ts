export type Tag = {
	label: string;
	parentLabels: string[];
	subLabels: string[];
};

export type RecTag = {
	// Recursive Tag
	lineage: string[];
	label: string;
	recSubTags: null | RecTag[];
};

export const sortUniArr = (a: string[]) => {
	return [...new Set(a)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
};

export function makeRecTags(tags: Tag[], targetLabel: string) {
	const tagMap: Map<string, Tag> = new Map();
	tags.forEach((tag) => tagMap.set(tag.label, tag));

	const expand = (label: string, lineage: string[] = []): RecTag => {
		const tag = tagMap.get(label);
		if (!tag) throw new Error(`Tag "${targetLabel}" not found`);
		return {
			label,
			lineage: [...lineage, label],
			recSubTags: lineage.includes(label)
				? null
				: tag.subLabels.map((subsetLabel) => expand(subsetLabel, [...lineage, label])),
		};
	};

	return expand(targetLabel);
}
