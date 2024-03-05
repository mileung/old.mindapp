import { PlusIcon, XCircleIcon } from '@heroicons/react/16/solid';
import { ArrowUpOnSquareIcon } from '@heroicons/react/24/outline';
import { RefObject, useCallback, useMemo, useRef, useState } from 'react';
import { useTagTree, usePersona } from './GlobalState';
import { buildUrl, ping, post } from '../utils/api';
import { matchSorter } from 'match-sorter';
import { TagTree, sortUniArr } from '../utils/tags';
import { Thought } from '../utils/thought';
import { onFocus } from '../utils/input';
import { useKeyPress } from '../utils/keyboard';

export const ThoughtWriter = ({
	parentRef,
	initialContent,
	initialTags = [],
	editId,
	parentId,
	onWrite,
	onContentBlur,
}: {
	parentRef?: RefObject<HTMLTextAreaElement>;
	initialContent?: string | string[];
	initialTags?: string[];
	editId?: string;
	parentId?: string;
	onWrite?: (
		res: { mentionedThoughts: Record<string, Thought>; thought: Thought },
		ctrlKey: boolean,
		altKey: boolean,
	) => void;
	onContentBlur?: () => void;
}) => {
	const [tagTree, tagTreeSet] = useTagTree();
	const [personaId] = usePersona();
	const [tags, tagsSet] = useState<string[]>(initialTags);
	const [tagFilter, tagFilterSet] = useState('');
	const [suggestTags, suggestTagsSet] = useState(false);
	const contentTextArea = parentRef || useRef<HTMLTextAreaElement>(null);
	const tagIpt = useRef<null | HTMLInputElement>(null);
	const tagXs = useRef<(null | HTMLButtonElement)[]>([]);
	const tagSuggestionsRefs = useRef<(null | HTMLButtonElement)[]>([]);

	const suggestedTags = useMemo(
		() =>
			matchSorter(
				Object.keys(tagTree?.branchNodes || [])
					.filter((tag) => !tags.includes(tag))
					.concat((tagTree?.leafNodes || []).filter((tag) => !tags.includes(tag))),
				tagFilter,
			),
		[tagTree, tagFilter, tags],
	);

	const writeThought = useCallback(
		(additionalTag?: string, ctrlKey?: boolean, altKey?: boolean) => {
			const content = contentTextArea.current!.value;
			if (!content) return;
			ping<{ mentionedThoughts: Record<string, Thought>; thought: Thought }>(
				buildUrl('write-thought'),
				post({
					parentId,
					createDate: +editId?.split('.', 1)[0]! || undefined,
					authorId: personaId,
					spaceId: null,
					content: separateMentions(content),
					tags: sortUniArr(tags.concat(additionalTag || [])),
				}),
			)
				.then((res) => {
					// caching is premature optimization atm. Just ping local sever to update ui
					onWrite && onWrite(res, !!ctrlKey, !!altKey);
					contentTextArea.current!.value = '';
					tagIpt.current!.value = '';
					tagsSet([]);
					tagFilterSet('');
					suggestTagsSet(false);
					contentTextArea.current!.focus();

					ping<TagTree>(buildUrl('get-tag-tree'))
						.then((data) => tagTreeSet(data))
						.catch((err) => alert(JSON.stringify(err)));
				})
				.catch((err) => alert(JSON.stringify(err)));
		},
		[editId, parentId, personaId, onWrite, tags],
	);

	const onAddingTagBlur = useCallback(() => {
		setTimeout(() => {
			const focusedOnTagOptions = tagSuggestionsRefs.current.includes(
				// @ts-ignore
				document.activeElement,
			);
			if (!focusedOnTagOptions && tagIpt.current !== document.activeElement) {
				suggestTagsSet(false);
			}
		}, 0);
	}, []);

	useKeyPress(
		{ key: 'Enter', modifiers: ['Meta', 'Alt', 'Control'] },
		(event) => {
			const focusedSuggestionIndex = tagSuggestionsRefs.current.findIndex(
				(e) => e === document.activeElement,
			);
			const focusedOnTagInput = document.activeElement === tagIpt.current;
			const focusedOnTagSuggestion = focusedSuggestionIndex !== -1;
			const focusedOnThoughtWriter =
				document.activeElement === contentTextArea.current ||
				focusedOnTagInput ||
				focusedOnTagSuggestion;

			if (focusedOnThoughtWriter) {
				writeThought(
					suggestedTags![focusedSuggestionIndex] || tagIpt.current!.value,
					event.ctrlKey,
					event.altKey,
				);
			}
		},
		[suggestedTags, writeThought],
	);

	const defaultValue = useMemo(
		() => (Array.isArray(initialContent) ? initialContent.join('') : initialContent),
		[],
	);

	return (
		<div className="w-full flex flex-col">
			<textarea
				autoFocus
				defaultValue={defaultValue}
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
				{!!tags.length && (
					<div
						className="mb-0.5 fx flex-wrap px-3 py-1 gap-1 rounded-t bg-bg2 text-lg"
						onClick={() => tagIpt.current!.focus()}
					>
						{tags.map((name, i) => (
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
										const newTags = [...tags];
										newTags.splice(i, 1);
										tagsSet(newTags);
										!newTags.length || i === newTags.length
											? tagIpt.current?.focus()
											: tagXs.current[i - (e.shiftKey ? 1 : 0)]?.focus();
									}}
									onKeyDown={(e) => {
										if (e.key === 'Backspace' || e.key === 'Enter') {
											tagXs.current[i]?.click();
										} else {
											tagIpt.current?.focus();
										}
									}}
								>
									<XCircleIcon className="w-4 h-4 text-fg2 group-hover:text-fg1 transition" />
								</button>
							</div>
						))}
					</div>
				)}
				<input
					autoComplete="off"
					className={`px-3 py-1 text-xl bg-mg1 w-full overflow-hidden transition brightness-95 dark:brightness-75 focus:brightness-100 focus:dark:brightness-100 ${tags.length ? '' : 'rounded-t'} ${suggestTags ? '' : 'rounded-b'}`}
					placeholder="Add tags with Enter"
					ref={tagIpt}
					onFocus={() => suggestTagsSet(true)}
					onBlur={onAddingTagBlur}
					onClick={() => suggestTagsSet(true)}
					onChange={(e) => tagFilterSet(e.target.value.trim().replace(/\s\s+/g, ' '))}
					onKeyDown={(e) => {
						e.key === 'Escape' && contentTextArea.current?.focus();
						if (tagFilter && e.key === 'Enter' && !e.metaKey) {
							tagIpt.current!.value = '';
							tagsSet([...new Set([...tags, tagFilter])]);
							tagFilterSet('');
						}
						if (e.key === 'ArrowDown') {
							e.preventDefault();
							tagSuggestionsRefs.current[0]?.focus();
						}
					}}
				/>
				{suggestTags && (
					<div className="z-20 flex flex-col overflow-scroll rounded-b mt-0.5 bg-mg1 absolute w-full max-h-56 shadow">
						{suggestedTags.map((tag, i) => {
							return (
								<button
									key={i}
									className="fx px-3 text-xl -outline-offset-2 transition hover:bg-mg2"
									ref={(r) => (tagSuggestionsRefs.current[i] = r)}
									onBlur={onAddingTagBlur}
									onKeyDown={(e) => {
										if (e.key === 'ArrowUp') {
											e.preventDefault();
											!i ? tagIpt.current?.focus() : tagSuggestionsRefs.current[i - 1]?.focus();
										} else if (e.key === 'ArrowDown') {
											e.preventDefault();
											tagSuggestionsRefs.current[i + 1]?.focus();
										} else if (!['Enter', 'Tab', 'Shift'].includes(e.key)) {
											tagIpt.current?.focus();
										}
									}}
									onClick={() => {
										tagsSet([...new Set([...tags, tag])]);
										tagIpt.current!.value = '';
										tagIpt.current!.focus();
										tagFilterSet('');
									}}
								>
									{tag}
								</button>
							);
						})}
					</div>
				)}
			</div>
			<div className="mt-1 fx justify-end gap-1.5">
				<button className="px-2 transition text-fg2 hover:text-fg1" onClick={() => writeThought()}>
					<ArrowUpOnSquareIcon className="h-6 w-6" />
				</button>
				<button
					className="px-2 rounded text-lg font-semibold transition bg-mg1 hover:bg-mg2"
					onClick={() => writeThought()}
				>
					<PlusIcon className="h-7 w-7" />
				</button>
			</div>
		</div>
	);
};

const thoughtIdRegex = /\d{13}\.(null|\d{13})\.(null|\d{13})/g;
function separateMentions(text: string) {
	const matches = text.matchAll(thoughtIdRegex);
	const result: string[] = [];
	let start = 0;
	for (const match of matches) {
		result.push(text.substring(start, match.index), match[0]);
		start = match.index! + match[0].length;
	}
	if (start < text.length) {
		result.push(text.substring(start));
	}
	return result.length > 1 ? result : text;
}
