import { useCallback, useEffect, useState } from 'react';
import ThoughtBlock, { RecThought } from '../components/ThoughtBlock';
import { buildUrl, pinger } from '../utils/api';
import { ThoughtWriter } from './ThoughtWriter';
import { useLocation } from 'react-router-dom';

export default function Results({
	query,
}: {
	query?: {
		tagLabels: string[];
		other: string[];
	};
}) {
	const [roots, rootsSet] = useState<(null | RecThought)[]>([]);
	const location = useLocation();

	const loadMoreThoughts = useCallback(() => {
		const lastRoot = roots[roots.length - 1];
		if (lastRoot === null) return;
		const rootsBefore = roots.length ? lastRoot.createDate : Date.now();
		const ignoreRootIds = roots.map(
			(root) => root && root.createDate + '.' + root.authorId + '.' + root.spaceId,
		);
		pinger<RecThought[]>(buildUrl(query ? 'search-local-thoughts' : 'get-local-thoughts'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...query,
				rootsBefore,
				ignoreRootIds,
			}),
		})
			.then((moreRoots) => {
				const rootsPerLoad = 8;
				const newRoots = [...roots, ...moreRoots];
				moreRoots.length < rootsPerLoad && newRoots.push(null);
				rootsSet(newRoots);
			})
			.catch((err) => alert(JSON.stringify(err)));
	}, [roots, query]);

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

	useEffect(() => {
		if (!roots.length) {
			loadMoreThoughts();
		}
	}, [roots, loadMoreThoughts]);

	useEffect(() => rootsSet([]), [location]);

	return (
		<>
			<ThoughtWriter
				initialTags={query?.tagLabels}
				onWrite={(thought) => rootsSet([thought, ...roots])}
			/>
			<div className="mt-3 space-y-1.5">
				{roots.map(
					(thought, i) =>
						thought && (
							<ThoughtBlock
								key={i}
								roots={roots}
								onRootsChange={(newRoots) => rootsSet(newRoots)}
								rootsIndices={[i]}
								thought={thought}
							/>
						),
				)}
			</div>
		</>
	);
}
