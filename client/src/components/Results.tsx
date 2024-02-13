import { useCallback, useEffect } from 'react';
import ThoughtBlock, { RecThought } from '../components/ThoughtBlock';
import { buildUrl, pinger } from '../utils/api';
import { resultsUse } from '../components/GlobalState';
import { useSearchParams } from 'react-router-dom';

export default function Results() {
	const [searchParams] = useSearchParams();
	const searchedKeywords = searchParams.get('search') || '';
	const [roots, rootsSet] = resultsUse();

	const loadMoreThoughts = useCallback(() => {
		const lastRoot = roots[roots.length - 1];
		if (lastRoot === null) return;
		const thoughtsAfter = roots.length ? lastRoot.createDate : Date.now();
		pinger<RecThought[]>(
			buildUrl('get-local-thoughts', {
				thoughtsAfter,
				oldToNew: false,
				ignoreRootIds: roots.map(
					(root) => root && root.createDate + '.' + root.authorId + '.' + root.spaceId,
				),
			}),
		)
			.then((moreRoots) => {
				const rootsPerLoad = 8;
				const rootsNew = [...roots, ...moreRoots];
				moreRoots.length < rootsPerLoad && rootsNew.push(null);
				rootsSet(rootsNew);
			})
			.catch((err) => alert(JSON.stringify(err)));
	}, [roots]);

	useEffect(() => {
		let rootsLengthLastLoad: number;
		const handleScroll = () => {
			const scrollPosition = window.innerHeight + window.scrollY;
			const documentHeight = document.body.offsetHeight;

			if (roots[roots.length - 1] !== null && scrollPosition >= documentHeight - 100) {
				if (roots.length !== rootsLengthLastLoad) {
					rootsLengthLastLoad = roots.length;
					loadMoreThoughts();
				}
			}
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [roots, loadMoreThoughts]);

	useEffect(() => loadMoreThoughts(), []);

	return (
		<div className="">
			<div className="mt-3 space-y-1.5">
				{roots.map(
					(thought, i) =>
						thought && <ThoughtBlock key={i} resultsIndices={[i]} thought={thought} />,
				)}
				{roots[roots.length - 1] !== null && (
					<button
						className="rounded self-center px-3 bg-mg1 hover:bg-mg2"
						onClick={loadMoreThoughts}
					>
						Load more
					</button>
				)}
			</div>
		</div>
	);
}
