import { useSearchParams } from 'react-router-dom';
import Results from '../components/Results';
import { Tag, makeSortedUniqueArr } from '../utils/tags';
import { tagsUse } from '../components/GlobalState';
import { useMemo } from 'react';

function parseQ(input: string, tags: Tag[]) {
	const bracketRegex = /\[([^\[\]]+)]/g;
	const explicitTagLabels = (input.match(bracketRegex) || []).map((match) => match.slice(1, -1));
	const other = input
		.replace(bracketRegex, ' ')
		.split(/\s!/g)
		.map((a) => a.trim())
		.filter((a) => !!a);

	const processedTagLabels: Set<string> = new Set();
	const subTagLabels: string[] = [];

	const findTags = (label: string) => {
		const tag = tags.find((t) => t.label === label);
		if (tag && !processedTagLabels.has(tag.label)) {
			processedTagLabels.add(tag.label);
			subTagLabels.push(tag.label);
			tag.subLabels.forEach(findTags);
		}
	};

	explicitTagLabels.forEach(findTags);

	return {
		initialTagLabels: explicitTagLabels,
		query: {
			tagLabels: makeSortedUniqueArr(explicitTagLabels.concat(subTagLabels)),
			other,
		},
	};
}

export default function Search() {
	const [tags] = tagsUse();
	const [searchParams] = useSearchParams();
	const q = searchParams.get('q') || '';
	const { initialTagLabels, query } = useMemo(() => parseQ(q, tags || []), [q, tags]);

	return (
		<div className="p-3">
			{tags && <Results initialTagLabels={initialTagLabels} query={query} />}
		</div>
	);
}
