import {
	TableCellsIcon,
	ChatBubbleBottomCenterTextIcon,
	BarsArrowDownIcon,
	BarsArrowUpIcon,
} from '@heroicons/react/16/solid';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ThoughtBlock from '../components/ThoughtBlock';
import { buildUrl, ping, post } from '../utils/api';
import { RecThought, Thought, getThoughtId } from '../utils/thought';
import { ThoughtWriter } from './ThoughtWriter';
import { isRecord } from '../utils/js';
import { useDefaultNames, useMentionedThoughts } from '../utils/state';

const defaultColumnLabels = [
	'createDate',
	'authorId',
	'spaceId',
	'content',
	'tags',
	'parentId',
	'childrenIds',
	'mentionedByIds',
];

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
	const [defaultNames, defaultNamesSet] = useDefaultNames();
	const [mentionedThoughts, mentionedThoughtsSet] = useMentionedThoughts();
	const [queriedThoughtRoot, queriedThoughtRootSet] = useState<null | RecThought>(null);
	const [roots, rootsSet] = useState<(null | RecThought)[]>([]);
	const [freeForm, freeFormSet] = useState(!!true);
	const [oldToNew, oldToNewSet] = useState(false);
	const [columnLabels, columnLabelsSet] = useState(defaultColumnLabels);
	const queriedThoughtId = useMemo(() => query?.thoughtId, [query?.thoughtId]);
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
			moreDefaultNames: Record<string, string>;
			latestCreateDate: number;
			moreRoots: RecThought[];
		}>(
			buildUrl('get-roots'),
			post({
				...query,
				ignoreRootIds,
				freeForm,
				oldToNew,
				thoughtsBeyond: thoughtsBeyond.current,
			}),
		)
			.then((data) => {
				defaultNamesSet({ ...defaultNames, ...data.moreDefaultNames });
				mentionedThoughtsSet({ ...mentionedThoughts, ...data.moreMentions });
				const rootsPerLoad = freeForm ? 8 : 40;
				const newRoots = roots.concat(data.moreRoots);
				data.moreRoots.length < rootsPerLoad && newRoots.push(null);
				thoughtsBeyond.current = data.latestCreateDate;
				rootsSet(newRoots);

				data.moreRoots.forEach((root) => {
					if (isRecord(root.content)) {
						const newColumnLabels = [...columnLabels];
						newColumnLabels.unshift(
							...Object.keys(root.content).filter((a) => !columnLabels.includes(a)),
						);
						columnLabelsSet(newColumnLabels);
					}
				});
			})
			.catch((err) => alert(JSON.stringify(err)))
			.finally(() => (pinging.current = false));
	}, [roots, freeForm, oldToNew, query]);

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
		<div className={`space-y-1.5 relative`}>
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
				/>
			)}
			{queriedThoughtId && roots.length > 1 && (
				<p className={`text-xl text-fg2 text-center ${queriedThoughtId && !freeForm && 'my-1.5'}`}>
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
			<div className="fx gap-3">
				{roots.length > (queriedThoughtId ? 2 : 1) && (
					<button
						className="h-4 fx text-fg2 hover:text-fg1 transition"
						onClick={() => {
							freeFormSet(!freeForm);
							rootsSet([]);
						}}
					>
						{freeForm ? (
							<ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
						) : (
							<TableCellsIcon className="h-5 w-5" />
						)}
						<p className="ml-1 font-medium">{freeForm ? 'Free-form' : 'Spreadsheet'}</p>
					</button>
				)}
				{(!queriedThoughtId || !!queriedThoughtRoot) &&
					roots.length > (queriedThoughtId ? 3 : 2) &&
					freeForm && (
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
			</div>
			{freeForm
				? roots.slice(queriedThoughtId ? 1 : 0).map((thought, i) => {
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
							/>
						);
					})
				: roots.length > (queriedThoughtId ? 2 : 1) && (
						<div className="-mx-3 w-screen overflow-x-scroll">
							<div
								className="grid gap-0 w-fit border border-fg2"
								style={{
									gridTemplateColumns: `auto repeat(${columnLabels.length}, minmax(5rem, 1fr))`,
								}}
							>
								{['', ...columnLabels].map((field, i) => (
									<div key={i} className="flex font-mono px-1 border border-fg2">
										{!!i && (
											<>
												<div className="border-r-2 border-fg2 pr-1 mr-1">
													{numberToLetter(i - 1)}
												</div>
												<div className="truncate">{field}</div>
											</>
										)}
									</div>
								))}
								{roots.slice(queriedThoughtId ? 1 : 0).map(
									(thought, i) =>
										thought && (
											<React.Fragment key={getThoughtId(thought)}>
												<div className="w-full fy whitespace-pre font-mono px-1 border border-fg2">
													{String(i)}
												</div>
												{columnLabels.map((col) => {
													const val = defaultColumnLabels.includes(col)
														? // @ts-ignore
															thought[col]
														: isRecord(thought.content)
															? // @ts-ignore
																thought.content[col]
															: undefined;
													return (
														<button
															key={col}
															className="flex justify-start font-mono px-1 border border-fg2 truncate -outline-offset-1 hover:outline hover:outline-sky-600 focus:outline focus:outline-sky-500 hover:z-20 focus:z-10"
														>
															{typeof val === 'object'
																? JSON.stringify(val)
																: val === undefined
																	? ''
																	: String(val)}
														</button>
													);
												})}
											</React.Fragment>
										),
								)}
							</div>
						</div>
					)}
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

function numberToLetter(num: number) {
	const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let result = '';
	while (num >= 0) {
		result = letters[num % 26] + result;
		num = Math.floor(num / 26) - 1;
	}
	return result;
}
