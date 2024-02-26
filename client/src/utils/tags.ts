export type Tag = {
	label: string;
	parentLabels: string[];
	subLabels: string[];
};

export type RecTag = {
	// rec = recursive
	lineage: string[];
	label: string;
	recSubTags: null | RecTag[];
};

export const makeRecTags = (tags: Tag[]): RecTag[] => {
	const tagMap: { [label: string]: Tag } = {};
	tags.forEach((tag) => (tagMap[tag.label] = tag));

	const buildRecTag = (label: string, lineage: string[] = []): RecTag => {
		const tag = tagMap[label];

		return {
			label,
			lineage: [...lineage, label],
			recSubTags: lineage.includes(label)
				? null
				: tag.subLabels.map((subsetLabel) => buildRecTag(subsetLabel, [...lineage, label])),
		};
	};

	return tags.map(({ label }) => buildRecTag(label));
};

// Example usage:
// const tags: Tag[] = [
// 	{ label: 'A', parentLabels: ['B'], subLabels: [] },
// 	{ label: 'B', parentLabels: ['C'], subLabels: ['A'] },
// 	{ label: 'C', parentLabels: [], subLabels: ['B'] },
// ];

// const RecTags: RecTag[] = makeRecTags(tags);
// console.log(RecTags);

export const sortUniArr = (a: string[]) => {
	return [...new Set(a)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
};
