import { BarsArrowDownIcon, BarsArrowUpIcon } from '@heroicons/react/16/solid';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ThoughtBlock from '../components/ThoughtBlock';
import { buildUrl, ping, post } from '../utils/api';
import { RecThought, Thought, getThoughtId } from '../utils/thought';
import { ThoughtWriter } from './ThoughtWriter';

export default function Results({
	query,
}: {
	query?: {
		tags?: string[];
		other?: string[];
		thoughtId?: string;
	};
}) {
	const location = useLocation();
	const [mentionedThoughts, mentionedThoughtsSet] = useState<Record<string, Thought>>({});
	const [queriedThoughtRoot, queriedThoughtRootSet] = useState<null | RecThought>(null);
	const [roots, rootsSet] = useState<(null | RecThought)[]>([]);
	const [oldToNew, oldToNewSet] = useState(false);
	const queriedThoughtId = query?.thoughtId;
	const queriedThoughtMentionedRoots = !queriedThoughtId ? null : roots.slice(1);
	const thoughtsBeyond = useRef(oldToNew ? 0 : Number.MAX_SAFE_INTEGER);
	const pinging = useRef(false);
	const rootTextArea = useRef<HTMLTextAreaElement>(null);
	const linkingThoughtId = useRef('');
	useEffect(() => {
		queriedThoughtId && roots[0] && queriedThoughtRootSet(roots[0]);
	}, [roots]);

	const loadMoreThoughts = useCallback(() => {
		const lastRoot = roots.slice(-1)[0];
		if (lastRoot === null) return;
		const ignoreRootIds = roots.map((root) => root && getThoughtId(root));
		pinging.current = true;
		ping<{
			moreMentions: Record<string, Thought>;
			latestCreateDate: number;
			moreRoots: RecThought[];
		}>(
			buildUrl('get-roots'),
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
				const newRoots = roots.concat(moreRoots);
				(query?.thoughtId || moreRoots.length < rootsPerLoad) && newRoots.push(null);
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

			if (roots.slice(-1)[0] !== null && scrollPosition >= documentHeight - 100) {
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
			thoughtsBeyond.current = oldToNew ? 0 : Number.MAX_SAFE_INTEGER;
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
					onRootsChange={(newRoots) => {
						if (!newRoots[0] || getThoughtId(newRoots[0]) !== getThoughtId(queriedThoughtRoot))
							queriedThoughtRootSet(null);
						rootsSet(newRoots);
					}}
					mentionedThoughts={mentionedThoughts!}
					onMentions={(moreMentions) =>
						mentionedThoughtsSet({ ...mentionedThoughts, ...moreMentions })
					}
				/>
			)}
			{queriedThoughtId && roots.length > 1 && (
				<p className="text-xl text-fg2 text-center">
					{roots.length === 2 ? 'No mentions' : 'Mentions'}
				</p>
			)}
			{!query && (
				<ThoughtWriter
					parentRef={rootTextArea}
					initialContent={queriedThoughtId}
					onWrite={({ mentionedThoughts: mentions, thought }, ctrlKey) => {
						ctrlKey && (linkingThoughtId.current = getThoughtId(thought));
						setTimeout(() => {
							mentionedThoughtsSet({ ...mentionedThoughts, ...mentions });
							rootsSet([thought, ...roots]);
						}, 0);
					}}
				/>
			)}
			{(!queriedThoughtId || !!queriedThoughtRoot) && roots.length > (queriedThoughtId ? 3 : 2) && (
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
			{!queriedThoughtId && roots[0] === null && (
				<p className="text-2xl text-center">No thoughts found</p>
			)}
			{!queriedThoughtId && roots.length > 1 && roots.slice(-1)[0] === null && (
				<p className="text-xl text-fg2 text-center">End of results </p>
			)}
		</div>
	);
}
