export type Tag = {
	label: string;
	parentTags: string[];
	subTags: string[];
};

export type RecursiveTag = {
	lineage: string[];
	label: string;
	subTags: null | RecursiveTag[];
};

export const makeRecursiveTags = (tags: Tag[]): RecursiveTag[] => {
	const tagMap: { [label: string]: Tag } = {};
	const recursiveTags: RecursiveTag[] = [];

	// Convert array of tags to map for easy lookup
	tags.forEach((tag) => {
		tagMap[tag.label] = tag;
	});

	const buildRecursiveTag = (label: string, lineage: string[]): RecursiveTag => {
		const tag = tagMap[label];

		// Check for loop in lineage
		if (lineage.includes(label)) {
			return {
				lineage: [...lineage, label],
				label,
				subTags: null,
			};
		}

		const subTags: RecursiveTag[] = tag.subTags.map((subsetLabel) =>
			buildRecursiveTag(subsetLabel, [...lineage, label])
		);

		return {
			lineage: [...lineage, label],
			label,
			subTags,
		};
	};

	// Build RecursiveTags for each Tag
	Object.keys(tagMap).forEach((tagLabel) => {
		// if (!tagMap[tagLabel].parentTags.length) {
		recursiveTags.push(buildRecursiveTag(tagLabel, []));
		// }
	});

	return recursiveTags;
};

// Example usage:
// const tags: Tag[] = [
// 	{ label: 'A', parentTags: ['B'], subTags: [] },
// 	{ label: 'B', parentTags: ['C'], subTags: ['A'] },
// 	{ label: 'C', parentTags: [], subTags: ['B'] },
// ];

// const recursiveTags: RecursiveTag[] = makeRecursiveTags(tags);
// console.log(recursiveTags);
