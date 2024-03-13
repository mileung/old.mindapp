import { PlusIcon, XCircleIcon } from '@heroicons/react/16/solid';
// import { ArrowUpOnSquareIcon } from '@heroicons/react/24/outline';
import { MutableRefObject, useCallback, useMemo, useRef, useState } from 'react';
import { useTagTree, usePersona, useLastUsedTags } from './GlobalState';
import { buildUrl, ping, post } from '../utils/api';
import { matchSorter } from 'match-sorter';
import { TagTree, sortUniArr } from '../utils/tags';
import { Thought } from '../utils/thought';
import { onFocus } from '../utils/input';
import { useKeyPress } from '../utils/keyboard';
import { useSearchParams } from 'react-router-dom';
import TextareaAutoHeight from './TextareaAutoHeight';

export const ThoughtWriter = ({
	parentRef,
	initialContent,
	initialTags = [],
	editId,
	parentId,
	onWrite,
	onContentBlur,
}: {
	parentRef?: MutableRefObject<null | HTMLTextAreaElement>;
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
	const [searchParams] = useSearchParams();
	const jsonString = searchParams.get('json');
	const jsonParam = useMemo(
		() =>
			jsonString
				? (JSON.parse(jsonString) as { initialContent: string; initialTags?: string[] })
				: null,
		[],
	);
	const [lastUsedTags, lastUsedTagsSet] = useLastUsedTags();
	const [tagTree, tagTreeSet] = useTagTree();
	const [personaId] = usePersona();
	const [tags, tagsSet] = useState<string[]>([...initialTags, ...(jsonParam?.initialTags || [])]);
	const [tagFilter, tagFilterSet] = useState('');
	const [tagIndex, tagIndexSet] = useState(-1);
	const [suggestTags, suggestTagsSet] = useState(false);
	const contentTextArea = parentRef || useRef<null | HTMLTextAreaElement>(null);
	const tagIpt = useRef<null | HTMLInputElement>(null);
	const tagXs = useRef<(null | HTMLButtonElement)[]>([]);
	const tagSuggestionsRefs = useRef<(null | HTMLButtonElement)[]>([]);

	const suggestedTags = useMemo(() => {
		let arr = matchSorter(
			Object.keys(tagTree?.branchNodes || {}).concat(tagTree?.leafNodes || []),
			tagFilter,
		);
		if (tagFilter) {
			arr.push(tagFilter);
		} else {
			arr.unshift(...lastUsedTags);
		}
		arr = [...new Set(arr)].filter((tag) => !tags.includes(tag));
		return arr;
	}, [tagTree, tagFilter, lastUsedTags, tags]);

	const writeThought = useCallback(
		(ctrlKey?: boolean, altKey?: boolean) => {
			const content = contentTextArea.current!.value;
			if (!content) return;
			const additionalTag = ((suggestTags && suggestedTags[tagIndex]) || tagFilter).trim();
			ping<{ mentionedThoughts: Record<string, Thought>; thought: Thought }>(
				buildUrl('write-thought'),
				post({
					parentId,
					createDate: +editId?.split('.', 1)[0]! || undefined,
					authorId: personaId,
					spaceId: null,
					content: separateMentions(content.trim()),
					tags: sortUniArr([...tags, additionalTag].filter((a) => !!a)),
				}),
			)
				.then((res) => {
					// caching is premature optimization atm. Just ping local sever to update ui
					onWrite && onWrite(res, !!ctrlKey, !!altKey);
					contentTextArea.current!.value = '';
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
		[suggestedTags, tagIndex, tagFilter, editId, parentId, personaId, onWrite, tags],
	);

	useKeyPress(
		{ key: 'Enter', modifiers: ['Meta', 'Alt', 'Control'] },
		(e) => {
			console.log('e:', e);
			const focusedOnThoughtWriter =
				document.activeElement === contentTextArea.current ||
				document.activeElement === tagIpt.current;
			if (focusedOnThoughtWriter) {
				writeThought(e.ctrlKey, e.altKey);
			}
		},
		[suggestedTags, writeThought],
	);

	const defaultValue = useMemo(
		() =>
			jsonParam?.initialContent ||
			(Array.isArray(initialContent) ? initialContent.join('') : initialContent),
		[],
	);

	return (
		<div className="w-full flex flex-col">
			<TextareaAutoHeight
				autoFocus
				defaultValue={defaultValue}
				ref={contentTextArea}
				onFocus={onFocus}
				name="content"
				placeholder="New thought"
				className="rounded text-xl font-thin font-mono px-3 py-2 w-full max-w-full resize-y min-h-36 bg-mg1 transition brightness-[0.97] dark:brightness-75 focus:brightness-100 focus:dark:brightness-100"
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						contentTextArea.current?.blur();
						onContentBlur && onContentBlur();
					}
					// if (e.key === 'Tab' && !e.shiftKey) {
					// 	e.preventDefault();
					// 	tagIpt.current?.focus();
					// }
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
										!newTags.length || (i === newTags.length && !e.shiftKey)
											? tagIpt.current?.focus()
											: tagXs.current[i - (e.shiftKey ? 1 : 0)]?.focus();
									}}
									onKeyDown={(e) => {
										if (e.key === 'Backspace') {
											tagXs.current[i]?.click();
										} else if (
											!['Control', 'Alt', 'Tab', 'Shift', 'Meta', 'Enter'].includes(e.key)
										) {
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
					className={`px-3 py-1 text-xl bg-mg1 w-full overflow-hidden transition brightness-[0.97] dark:brightness-75 focus:brightness-100 focus:dark:brightness-100 ${tags.length ? '' : 'rounded-t'} ${suggestTags ? '' : 'rounded-b'}`}
					placeholder="Search tags"
					ref={tagIpt}
					onFocus={() => suggestTagsSet(true)}
					onBlur={() => {
						setTimeout(() => {
							const focusedSuggestionIndex = tagSuggestionsRefs.current.findIndex(
								(e) => e === document.activeElement,
							);
							if (document.activeElement !== tagIpt.current && focusedSuggestionIndex === -1) {
								tagIndexSet(-1);
								suggestTagsSet(false);
							}
						}, 0);
					}}
					value={tagFilter}
					onClick={() => suggestTagsSet(true)}
					onChange={(e) => {
						tagIndexSet(0);
						suggestTagsSet(true);
						tagFilterSet(e.target.value);
					}}
					onKeyDown={(e) => {
						if (e.key === 'Escape') {
							suggestTags ? suggestTagsSet(false) : contentTextArea.current?.focus();
						}
						if (e.key === 'ArrowUp') {
							e.preventDefault();
							const index = Math.max(tagIndex - 1, -1);
							tagSuggestionsRefs.current[index]?.focus();
							tagIpt.current?.focus();
							tagIndexSet(index);
						}
						if (e.key === 'ArrowDown') {
							e.preventDefault();
							const index = Math.min(tagIndex + 1, suggestedTags.length - 1);
							tagSuggestionsRefs.current[index]?.focus();
							tagIpt.current?.focus();
							tagIndexSet(index);
						}
						if (e.key === 'Tab') {
							suggestTagsSet(false);
						}
						if (e.key === 'Enter' && !(e.metaKey || e.altKey || e.ctrlKey)) {
							const tagToAdd = suggestedTags[tagIndex] || tagFilter.trim();
							if (tagToAdd && suggestTags) {
								tagsSet([...new Set([...tags, tagToAdd])]);
								tagFilterSet('');
								suggestTagsSet(false);
							} else {
								suggestTagsSet(true);
							}
						}
					}}
				/>
				{suggestTags && (
					<div className="z-20 flex flex-col overflow-scroll rounded-b mt-0.5 bg-mg1 absolute w-full max-h-56 shadow">
						{suggestedTags.map((tag, i) => {
							return (
								<button
									key={i}
									ref={(r) => (tagSuggestionsRefs.current[i] = r)}
									className={`fx px-3 text-xl hover:bg-mg2 ${tagIndex === i ? 'bg-mg2' : 'bg-mg1'}`}
									onClick={() => {
										tagsSet([...new Set([...tags, tag])]);
										tagIpt.current!.focus();
										tagFilterSet('');
										lastUsedTagsSet([...new Set([tag, ...lastUsedTags])].slice(0, 5));
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
				{/* <button TODO: upload files
					className="px-2.5 py-0.5 transition text-fg2 hover:text-fg1"
					onClick={() => writeThought()}
				>
					<ArrowUpOnSquareIcon className="h-6 w-6" />
				</button> */}
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
