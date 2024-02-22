import { useCallback, useEffect, useRef, useState } from 'react';
import ThoughtBlock, { RecThought, Thought, getThoughtId } from '../components/ThoughtBlock';
import { buildUrl, ping } from '../utils/api';
import { ThoughtWriter } from './ThoughtWriter';
import { useLocation } from 'react-router-dom';
import { BarsArrowDownIcon, BarsArrowUpIcon } from '@heroicons/react/16/solid';

export default function Results({
	initialTagLabels,
	query,
}: {
	initialTagLabels?: string[];
	query?: {
		tagLabels: string[];
		other: string[];
	};
}) {
	const [mentionedThoughts, mentionedThoughtsSet] = useState<Record<string, Thought>>({});
	const [roots, rootsSet] = useState<(null | RecThought)[]>([]);
	const location = useLocation();
	const [oldToNew, oldToNewSet] = useState(false);
	const thoughtsBeyond = useRef(oldToNew ? 0 : Date.now());
	const pinging = useRef(false);

	const loadMoreThoughts = useCallback(() => {
		const lastRoot = roots[roots.length - 1];
		if (lastRoot === null) return;
		const ignoreRootIds = roots.map((root) => root && getThoughtId(root));
		pinging.current = true;
		ping<{
			moreMentions: Record<string, Thought>;
			latestCreateDate: number;
			moreRoots: RecThought[];
		}>(buildUrl(query ? 'search-local-thoughts' : 'get-local-thoughts'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...query,
				ignoreRootIds,
				oldToNew,
				thoughtsBeyond: thoughtsBeyond.current,
			}),
		})
			.then(({ moreMentions, latestCreateDate, moreRoots }) => {
				mentionedThoughtsSet({ ...mentionedThoughts, ...moreMentions });
				const rootsPerLoad = 8;
				const newRoots = [...roots, ...moreRoots];
				moreRoots.length < rootsPerLoad && newRoots.push(null);
				thoughtsBeyond.current = latestCreateDate;
				rootsSet(newRoots);
			})
			.catch((err) => alert(JSON.stringify(err)))
			.finally(() => {
				pinging.current = false;
			});
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
		if (!roots.length && !pinging.current) {
			thoughtsBeyond.current = oldToNew ? 0 : Date.now();
			loadMoreThoughts();
		}
	}, [oldToNew, roots, loadMoreThoughts]);

	useEffect(() => rootsSet([]), [location]);

	return (
		<>
			<ThoughtWriter
				initialTagLabels={initialTagLabels}
				onWrite={({ mentionedThoughts: mentions, thought }) => {
					mentionedThoughtsSet({ ...mentionedThoughts, ...mentions });
					rootsSet([thought, ...roots]);
				}}
			/>
			<div className="space-y-1.5">
				<button
					className="h-4 fx text-fg2 hover:text-fg1 transition"
					onClick={() => {
						oldToNewSet(!oldToNew);
						rootsSet([]);
					}}
				>
					{oldToNew ? (
						<BarsArrowUpIcon className="h-5 w-5" />
					) : (
						<BarsArrowDownIcon className="h-5 w-5" />
					)}
					<p className="ml-1 font-medium">{oldToNew ? 'Old to new' : 'New to old'}</p>
				</button>
				{roots.map(
					(thought, i) =>
						thought && (
							<ThoughtBlock
								key={i}
								roots={roots}
								mentionedThoughts={mentionedThoughts}
								onRootsChange={(newRoots) => rootsSet(newRoots)}
								onMentions={(mentions) =>
									mentionedThoughtsSet({ ...mentionedThoughts, ...mentions })
								}
								rootsIndices={[i]}
								thought={thought}
							/>
						),
				)}
				{roots.length === 1 && roots[0] === null && (
					<p className="text-2xl text-center">No thoughts found</p>
				)}
				{roots.length > 1 && roots[roots.length - 1] === null && (
					<p className="text-xl text-fg2 text-center">End of results </p>
				)}
			</div>
		</>
	);
}
