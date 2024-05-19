import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Results from '../components/Results';
import { useTagTree } from '../utils/state';
import { TagTree, bracketRegex, getTags, sortUniArr } from '../utils/tags';

const authorIdsRegex = /@\w*/g;
const quoteRegex = /"([^"]+)"/g;
function getQuotes(input: string) {
	return (input.match(quoteRegex) || []).map((match) => match.slice(1, -1));
}

function parseQuery(input: string, tagTree: TagTree) {
	const tags = getTags(input);
	const quotes = getQuotes(input);
	const other = quotes
		.concat(
			input
				.replace(bracketRegex, ' ')
				.replace(quoteRegex, ' ')
				.replace(authorIdsRegex, ' ')
				.split(/\s+/g)
				.filter((a) => !!a),
		)
		.map((s) => s.toLowerCase());

	const processedTags: Set<string> = new Set();
	const subTags: string[] = [];

	const getSubTags = (tag: string) => {
		if (tag && !processedTags.has(tag)) {
			processedTags.add(tag);
			subTags.push(tag);
			(tagTree.parents[tag] || []).forEach(getSubTags);
		}
	};
	tags.forEach(getSubTags);

	return {
		tags: sortUniArr(tags.concat(subTags)),
		authorIds: input.match(authorIdsRegex)?.map((a) => a.slice(1)),
		other,
	};
}

export default function Search() {
	const [tagTree] = useTagTree();
	const [searchParams] = useSearchParams();
	const q = searchParams.get('q') || '';
	const urlQuery = useMemo(
		() => parseQuery(q, tagTree || { parents: {}, loners: [] }),
		[q, tagTree],
	);

	return <div className="p-3">{tagTree && <Results urlQuery={urlQuery} />}</div>;
}
