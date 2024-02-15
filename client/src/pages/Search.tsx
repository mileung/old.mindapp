import { useSearchParams } from 'react-router-dom';
import Results from '../components/Results';
import { Tag, makeSortedUniqueArr } from '../utils/tags';
import { tagsUse } from '../components/GlobalState';

function parseQuery(input: string, tags: Tag[]) {
	const bracketRegex = /\[([^\[\]]+)]/g;
	const tagLabels = (input.match(bracketRegex) || []).map((match) => match.slice(1, -1));
	const other = input
		.replace(bracketRegex, ' ')
		.split(/\s!/g)
		.map((a) => a.trim())
		.filter((a) => !!a);

	const processedTags: Set<string> = new Set();

	// Helper function to recursively find tags and subtags
	const findTags = (label: string) => {
		const tag = tags.find((t) => t.label === label);
		if (tag && !processedTags.has(tag.label)) {
			// console.log('tag:', tag);
			processedTags.add(tag.label);
			tagLabels.push(tag.label);

			// Recursively find parentLabels
			tag.parentLabels.forEach(findTags);

			// Recursively find subLabels
			tag.subLabels.forEach(findTags);
		}
	};

	// Iterate through each label in the array
	tagLabels.forEach(findTags);

	return {
		tagLabels: makeSortedUniqueArr(tagLabels),
		other,
	};
}

export default function Search() {
	const [tags] = tagsUse();
	const [searchParams] = useSearchParams();
	const q = searchParams.get('q') || '';

	return <div className="p-3">{tags && <Results query={parseQuery(q, tags)} />}</div>;
}
