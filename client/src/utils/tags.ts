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
	const RecTags: RecTag[] = [];

	// Convert array of tags to map for easy lookup
	tags.forEach((tag) => {
		tagMap[tag.label] = tag;
	});

	const buildRecTag = (label: string, lineage: string[]): RecTag => {
		const tag = tagMap[label];
		!tag && console.log(label, tag);

		// Check for loop in lineage
		if (lineage.includes(label)) {
			return {
				lineage: [...lineage, label],
				label,
				recSubTags: null,
			};
		}

		const recSubTags: RecTag[] = tag.subLabels.map((subsetLabel) =>
			buildRecTag(subsetLabel, [...lineage, label]),
		);

		return {
			lineage: [...lineage, label],
			label,
			recSubTags,
		};
	};

	// Build RecTags for each Tag
	Object.keys(tagMap).forEach((tagLabel) => {
		// if (!tagMap[tagLabel].parentLabels.length) {
		RecTags.push(buildRecTag(tagLabel, []));
		// }
	});

	return RecTags;
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
