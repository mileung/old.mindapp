import { useCallback, useEffect, useState } from 'react';
import ThoughtBlock, { RecThought } from '../components/ThoughtBlock';
import { ThoughtWriter } from '../components/ThoughtWriter';
import { buildUrl, pinger } from '../utils/api';

export default function Home() {
	const [roots, rootsSet] = useState<(null | RecThought)[]>([]);

	const loadMoreThoughts = useCallback(() => {
		const lastRoot = roots[roots.length - 1];
		if (lastRoot === null) return;
		const thoughtsAfter = roots.length ? lastRoot.createDate : Date.now();

		pinger<RecThought[]>(
			buildUrl('get-local-thoughts', {
				thoughtsAfter,
				oldToNew: false,
				ignoreRootIds: roots.map(
					(root) => root && root.spaceId + '.' + root.createDate + '.' + root.authorId
				),
			})
		)
			.then((additionalRoots) => {
				const rootsPerLoad = 8;
				const rootsNew = [...roots, ...additionalRoots];
				additionalRoots.length < rootsPerLoad && rootsNew.push(null);
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
			<ThoughtWriter />
			<div className="mt-3 space-y-1.5">
				{roots.map((thought, i) => thought && <ThoughtBlock key={i} thought={thought} />)}
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
