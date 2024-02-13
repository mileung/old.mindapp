import { useCallback, useEffect } from 'react';
import ThoughtBlock, { RecThought } from '../components/ThoughtBlock';
import { ThoughtWriter } from '../components/ThoughtWriter';
import { buildUrl, pinger } from '../utils/api';
import { resultsUse } from '../components/GlobalState';

export default function Home() {
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

	useEffect(() => loadMoreThoughts(), []);
	// QUESTION: Why does get-local-thoughts need cors but not whoami?
	// useEffect(() => {
	// 	(async () => {
	// 		const thing = await (await fetch('http://localhost:3000/whoami')).json();
	// 		console.log('thing:', thing);
	// 	})();
	// }, []);

	return (
		<div className="p-3 flex-1">
			<ThoughtWriter onWrite={(thought) => rootsSet([thought, ...roots])} />
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
