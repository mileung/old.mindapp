import { CheckCircleIcon, PlusIcon, XCircleIcon } from '@heroicons/react/16/solid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTags, usePersona } from './GlobalState';
import { buildUrl, ping } from '../utils/api';
import { matchSorter } from 'match-sorter';
import { Tag, makeSortedUniqueArr } from '../utils/tags';
import { Thought } from './ThoughtBlock';
import { onFocus } from '../utils/input';

export const ThoughtWriter = ({
	initialContent,
	initialTagLabels = [],
	editId,
	parentId,
	onWrite,
	onContentBlur,
}: {
	initialContent?: string;
	initialTagLabels?: string[];
	editId?: string;
	parentId?: string;
	onWrite?: (thought: Thought, shiftKey: boolean, altKey: boolean) => void;
	onContentBlur?: () => void;
}) => {
	const [tags, tagsSet] = useTags();
	const [personaId] = usePersona();
	const [tagLabels, tagLabelsSet] = useState<string[]>(initialTagLabels);
	const [tagFilter, tagFilterSet] = useState('');
	const [suggestTags, suggestTagsSet] = useState(false);
	const contentTextArea = useRef<null | HTMLTextAreaElement>(null);
	const tagInput = useRef<null | HTMLInputElement>(null);
	const tagXs = useRef<(null | HTMLButtonElement)[]>([]);
	const tagSuggestionsRefs = useRef<(null | HTMLButtonElement)[]>([]);

	const suggestedTags = useMemo(
		() => matchSorter(tags?.map((a) => a.label) || [], tagFilter),
		[tags, tagFilter],
	);

	const writeThought = useCallback(
		(additionalTag?: string, shiftKey?: boolean, altKey?: boolean) => {
			// if you want to "delete" a post, you can remove the content/tags
			if (!editId && !contentTextArea.current!.value) return;
			ping<Thought>(buildUrl('write-thought'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					parentId,
					createDate: +editId?.split('.', 1)[0]! || undefined,
					authorId: personaId,
					spaceId: null,
					content: contentTextArea.current!.value,
					tagLabels: makeSortedUniqueArr([...tagLabels, ...(additionalTag ? [additionalTag] : [])]),
				}),
			})
				.then((thought) => {
					// caching is premature optimization atm. Just ping local sever to update ui
					onWrite && onWrite(thought, !!shiftKey, !!altKey);
					contentTextArea.current!.value = '';
					tagInput.current!.value = '';
					// tagLabelsSet([]);
					suggestTagsSet(false);

					ping<Tag[]>(buildUrl('get-tags'))
						.then((data) => tagsSet(data))
						.catch((err) => alert(JSON.stringify(err)));
				})
				.catch((err) => alert(JSON.stringify(err)));
		},
		[editId, parentId, onWrite, tagLabels],
	);

	const onAddingTagBlur = useCallback(() => {
		setTimeout(() => {
			const focusedOnTagOptions = tagSuggestionsRefs.current.includes(
				// @ts-ignore
				document.activeElement,
			);
			if (!focusedOnTagOptions && tagInput.current !== document.activeElement) {
				suggestTagsSet(false);
			}
		}, 0);
	}, []);

	useEffect(() => {
		let isMetaDown = false;
		const handleKeyPress = (event: KeyboardEvent) => {
			// console.log(event.key, isMetaDown, !event.repeat);
			if (event.key === 'Meta') {
				isMetaDown = event.type === 'keydown';
			} else if (event.key === 'Enter' && isMetaDown && !event.repeat) {
				const focusedSuggestionIndex = tagSuggestionsRefs.current.findIndex(
					(e) => e === document.activeElement,
				);
				const focusedOnTagInput = document.activeElement === tagInput.current;
				const focusedOnTagSuggestion = focusedSuggestionIndex !== -1;
				const focusedOnThoughtWriter =
					document.activeElement === contentTextArea.current ||
					focusedOnTagInput ||
					focusedOnTagSuggestion;

				if (focusedOnThoughtWriter) {
					writeThought(
						suggestedTags![focusedSuggestionIndex] || tagInput.current!.value,
						event.shiftKey,
						event.altKey,
					);
				}
			}
		};

		document.addEventListener('keydown', handleKeyPress);
		document.addEventListener('keyup', handleKeyPress);
		return () => {
			document.removeEventListener('keydown', handleKeyPress);
			document.removeEventListener('keyup', handleKeyPress);
		};
	}, [suggestedTags, writeThought]);

	useEffect(() => tagLabelsSet(initialTagLabels), [JSON.stringify(initialTagLabels)]);

	return (
		<div className="w-full flex flex-col">
			<textarea
				autoFocus
				defaultValue={initialContent}
				ref={contentTextArea}
				onFocus={onFocus}
				name="content"
				placeholder="New thought"
				className="rounded text-xl font-thin font-mono px-3 py-2 w-full max-w-full resize-y min-h-36 bg-mg1 transition brightness-95 dark:brightness-75 focus:brightness-100 focus:dark:brightness-100"
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						contentTextArea.current?.blur();
						onContentBlur && onContentBlur();
					}
				}}
			/>
			<div className="mt-1 relative">
				{!!tagLabels.length && (
					<div
						className="mb-0.5 fx flex-wrap px-3 py-1 gap-1 rounded-t bg-bg2 text-lg"
						onClick={() => tagInput.current!.focus()}
					>
						{tagLabels.map((name, i) => {
							return (
								<div key={i} className="text-fg1 flex group">
									<div
										className=""
										// onMouseEnter={} TODO: show set hierarchy
									>
										{name}
									</div>
									<button
										className="xy -ml-0.5 group h-7 w-7 rounded-full -outline-offset-4"
										ref={(r) => (tagXs.current[i] = r)}
										onClick={(e) => {
											e.stopPropagation(); // this is needed to focus the next tag
											tagXs.current[i - (e.shiftKey ? 1 : 0)]?.focus();
											const newCats = [...tagLabels];
											newCats.splice(i, 1);
											tagLabelsSet(newCats);
											tagInput.current?.focus();
										}}
									>
										<XCircleIcon className="w-4 h-4 text-fg2 group-hover:text-fg1 transition" />
									</button>
								</div>
							);
						})}
					</div>
				)}
				<input
					autoComplete="off"
					className={`mt-1 px-3 py-1 text-xl bg-mg1 w-full overflow-hidden transition brightness-95 dark:brightness-75 focus:brightness-100 focus:dark:brightness-100 ${tagLabels.length ? '' : 'rounded-t'} ${suggestTags ? '' : 'rounded-b'}`}
					placeholder="Add tags with Enter"
					ref={tagInput}
					onFocus={() => suggestTagsSet(true)}
					onBlur={onAddingTagBlur}
					onClick={() => suggestTagsSet(true)}
					onChange={(e) => tagFilterSet(e.target.value.trim().replace(/\s\s+/g, ' '))}
					onKeyDown={(e) => {
						if (tagFilter && e.key === 'Enter' && !e.metaKey) {
							tagInput.current!.value = '';
							tagLabelsSet([...new Set([...tagLabels, tagFilter])]);
							tagFilterSet('');
						} else if (e.key === 'Escape') {
							tagInput.current?.blur();
						}
					}}
				/>
				{suggestTags && (
					<div className="z-20 flex flex-col overflow-scroll rounded-b mt-0.5 bg-mg1 absolute w-full max-h-56 shadow">
						{suggestedTags.map((label, i) => {
							const tagIndex = tagLabels.indexOf(label);
							const intagLabels = tagIndex !== -1;
							return (
								<button
									key={i}
									className="fx px-3 text-xl -outline-offset-2 transition hover:bg-mg2"
									ref={(r) => (tagSuggestionsRefs.current[i] = r)}
									onBlur={onAddingTagBlur}
									onKeyDown={(e) => e.key === 'Escape' && suggestTagsSet(false)}
									onClick={() => {
										if (intagLabels) {
											const newtagLabels = [...tagLabels];
											newtagLabels.splice(tagIndex, 1);
											tagLabelsSet(newtagLabels);
										} else {
											tagLabelsSet([...new Set([...tagLabels, label])]);
										}
									}}
								>
									{label} {intagLabels && <CheckCircleIcon className="ml-1 h-3.5 w-3.5" />}
								</button>
							);
						})}
					</div>
				)}
			</div>
			<button
				className="mt-1 px-2 self-end rounded text-lg font-semibold transition bg-mg1 hover:bg-mg2"
				onClick={() => writeThought()}
			>
				<PlusIcon className="h-7 w-7" />
			</button>
		</div>
	);
};
