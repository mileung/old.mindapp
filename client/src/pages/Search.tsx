import { useSearchParams } from 'react-router-dom';
import Results from '../components/Results';
import { TagTree, sortUniArr } from '../utils/tags';
import { useTagTree } from '../components/GlobalState';
import { useMemo } from 'react';

export const bracketRegex = /\[([^\[\]]+)]/g;
export function getTags(input: string) {
	return (input.match(bracketRegex) || []).map((match) => match.slice(1, -1));
}

function parseQuery(input: string, tagTree: TagTree) {
	const tags = getTags(input);
	const other = input
		.replace(bracketRegex, ' ')
		.split(/\s+/g)
		.filter((a) => !!a);

	const processedTags: Set<string> = new Set();
	const subTags: string[] = [];

	const getSubTags = (tag: string) => {
		if (tag && !processedTags.has(tag)) {
			processedTags.add(tag);
			subTags.push(tag);
			(tagTree.branchNodes[tag] || []).forEach(getSubTags);
		}
	};
	tags.forEach(getSubTags);

	return {
		tags: sortUniArr(tags.concat(subTags)),
		other,
	};
}

export default function Search() {
	const [tagTree] = useTagTree();
	const [searchParams] = useSearchParams();
	const q = searchParams.get('q') || '';
	const query = useMemo(
		() => parseQuery(q, tagTree || { branchNodes: {}, leafNodes: [] }),
		[q, tagTree],
	);

	return <div className="p-3">{tagTree && <Results query={query} />}</div>;
}
