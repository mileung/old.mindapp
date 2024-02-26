import { BarsArrowDownIcon, BarsArrowUpIcon } from '@heroicons/react/16/solid';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ThoughtBlock from '../components/ThoughtBlock';
import { buildUrl, ping, post } from '../utils/api';
import { RecThought, Thought, getThoughtId } from '../utils/thought';
import { ThoughtWriter } from './ThoughtWriter';

export default function Results({
	initialTagLabels,
	query,
}: {
	initialTagLabels?: string[];
	query?: {
		tagLabels?: string[];
		other?: string[];
		thoughtId?: string;
	};
}) {
	const location = useLocation();
	const [mentionedThoughts, mentionedThoughtsSet] = useState<Record<string, Thought>>({});
	const [roots, rootsSet] = useState<(null | RecThought)[]>([]);
	const [oldToNew, oldToNewSet] = useState(false);
	const queriedThoughtId = query?.thoughtId;
	const queriedThoughtRoot = !queriedThoughtId ? null : roots[0];
	const queriedThoughtMentionedRoots = !queriedThoughtId ? null : roots.slice(1);
	const showThoughtWriter = !queriedThoughtId || !!queriedThoughtRoot;
	const thoughtsBeyond = useRef(oldToNew ? 0 : Date.now());
	const pinging = useRef(false);
	const rootTextArea = useRef<HTMLTextAreaElement>(null);
	const linkingThoughtId = useRef('');

	const loadMoreThoughts = useCallback(() => {
		const lastRoot = roots[roots.length - 1];
		if (lastRoot === null) return;
		const ignoreRootIds = roots.map((root) => root && getThoughtId(root));
		pinging.current = true;
		ping<{
			moreMentions: Record<string, Thought>;
			latestCreateDate: number;
			moreRoots: RecThought[];
		}>(
			buildUrl(query ? 'search-local-thoughts' : 'get-local-thoughts'),
			post({
				...query,
				ignoreRootIds,
				oldToNew,
				thoughtsBeyond: thoughtsBeyond.current,
			}),
		)
			.then(({ moreMentions, latestCreateDate, moreRoots }) => {
				mentionedThoughtsSet({ ...mentionedThoughts, ...moreMentions });
				const rootsPerLoad = 8;
				const newRoots = [...roots, ...moreRoots];
				moreRoots.length < rootsPerLoad && newRoots.push(null);
				thoughtsBeyond.current = latestCreateDate;
				rootsSet(newRoots);
			})
			.catch((err) => alert(JSON.stringify(err)))
			.finally(() => (pinging.current = false));
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
		<div className="space-y-1.5">
			{queriedThoughtRoot && (
				<ThoughtBlock
					highlightedId={queriedThoughtId}
					thought={queriedThoughtRoot}
					roots={roots}
					rootsIndices={[0]}
					onNewRoot={() => rootTextArea.current?.focus()}
					onRootsChange={(newRoots) => rootsSet(newRoots)}
					mentionedThoughts={mentionedThoughts!}
					onMentions={(moreMentions) =>
						mentionedThoughtsSet({ ...mentionedThoughts, ...moreMentions })
					}
				/>
			)}
			{!queriedThoughtId && (
				<ThoughtWriter
					parentRef={rootTextArea}
					initialContent={queriedThoughtId}
					initialTagLabels={initialTagLabels}
					onWrite={({ mentionedThoughts: mentions, thought }, shiftKey) => {
						shiftKey && (linkingThoughtId.current = getThoughtId(thought));
						setTimeout(() => {
							mentionedThoughtsSet({ ...mentionedThoughts, ...mentions });
							rootsSet([thought, ...roots]);
						}, 0);
					}}
				/>
			)}
			{showThoughtWriter && roots.length > (queriedThoughtId ? 3 : 2) && (
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
			)}
			{(queriedThoughtMentionedRoots || roots).map((thought, i) => {
				if (!thought) return;
				const thoughtId = getThoughtId(thought);
				return (
					<ThoughtBlock
						key={thoughtId}
						initiallyLinking={linkingThoughtId.current === thoughtId}
						thought={thought}
						roots={roots}
						rootsIndices={[i + (queriedThoughtRoot ? 1 : 0)]}
						onNewRoot={() => rootTextArea.current?.focus()}
						onRootsChange={(newRoots) => rootsSet(newRoots)}
						mentionedThoughts={mentionedThoughts}
						onMentions={(mentions) => mentionedThoughtsSet({ ...mentionedThoughts, ...mentions })}
					/>
				);
			})}
			{queriedThoughtId && roots[0] === null && (
				<div className="xy h-40">
					<p className="text-2xl">Thought not found</p>
				</div>
			)}
			{queriedThoughtId && roots.length === 2 && (
				<p className="text-xl text-fg2 text-center">No mentions</p>
			)}
			{!queriedThoughtId && roots[0] === null && (
				<p className="text-2xl text-center">No thoughts found</p>
			)}
			{!queriedThoughtId && roots.length > 1 && roots[roots.length - 1] === null && (
				<p className="text-xl text-fg2 text-center">End of results </p>
			)}
		</div>
	);
}
