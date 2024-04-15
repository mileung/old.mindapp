import {
	// ArrowUpOnSquareIcon,
	// ChatBubbleBottomCenterTextIcon,
	// ListBulletIcon,
	PlusIcon,
	XCircleIcon,
} from '@heroicons/react/16/solid';
import { MutableRefObject, useCallback, useMemo, useRef, useState } from 'react';
import {
	useTagTree,
	usePersonas,
	useLastUsedTags,
	useActivePersona,
	useActiveSpace,
	useMentionedThoughts,
	useDefaultNames,
} from '../utils/state';
import { buildUrl, ping, post } from '../utils/api';
import { matchSorter } from 'match-sorter';
import { TagTree, getNodes, getNodesArr, sortUniArr } from '../utils/tags';
import { Thought, separateMentions } from '../utils/thought';
import { useKeyPress } from '../utils/keyboard';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import TextareaAutoHeight from './TextareaAutoHeight';
import FieldsEditor from './FieldsEditor';
import { isJsonRecord, isStringRecord } from '../utils/js';

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
	initialContent?: Thought['content'];
	initialTags?: string[];
	editId?: string;
	parentId?: string;
	onWrite?: (
		res: {
			defaultNames: Record<string, string>;
			mentionedThoughts: Record<string, Thought>;
			thought: Thought;
		},
		ctrlKey: boolean,
		altKey: boolean,
	) => void;
	onContentBlur?: () => void;
}) => {
	const activePersona = useActivePersona();
	const activeSpace = useActiveSpace();
	const [searchParams] = useSearchParams();
	const jsonString = searchParams.get('json');
	const jsonParam = useMemo(
		() =>
			jsonString
				? (JSON.parse(jsonString) as { initialContent: string; initialTags?: string[] })
				: null,
		[],
	);
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const [defaultNames, defaultNamesSet] = useDefaultNames();
	const [mentionedThoughts, mentionedThoughtsSet] = useMentionedThoughts();
	const [lastUsedTags, lastUsedTagsSet] = useLastUsedTags();
	const [tagTree, tagTreeSet] = useTagTree();
	const [personas] = usePersonas();
	const [tags, tagsSet] = useState<string[]>([...initialTags, ...(jsonParam?.initialTags || [])]);
	const [tagFilter, tagFilterSet] = useState('');
	const [tagIndex, tagIndexSet] = useState(0);
	const [suggestTags, suggestTagsSet] = useState(false);
	const [freeForm, freeFormSet] = useState(true);
	const contentTextArea = parentRef || useRef<null | HTMLTextAreaElement>(null);
	const tagIpt = useRef<null | HTMLInputElement>(null);
	const tagXs = useRef<(null | HTMLButtonElement)[]>([]);
	const tagSuggestionsRefs = useRef<(null | HTMLButtonElement)[]>([]);
	const nodesArr = useMemo(() => tagTree && getNodesArr(getNodes(tagTree)), [tagTree]);
	const trimmedFilter = useMemo(() => tagFilter.trim(), [tagFilter]);
	const suggestedTags = useMemo(() => {
		if (!nodesArr || !suggestTags) return [];
		let arr = matchSorter(nodesArr, tagFilter);
		trimmedFilter ? arr.push(trimmedFilter) : arr.unshift(...lastUsedTags);
		arr = [...new Set(arr)].filter((tag) => !tags.includes(tag));
		return arr;
	}, [nodesArr, suggestTags, tagFilter, trimmedFilter, lastUsedTags, tags]);

	const addTag = useCallback(
		(tagToAdd?: string) => {
			tagToAdd = tagToAdd || suggestedTags[tagIndex] || trimmedFilter;
			if (!tagToAdd) return;
			tagsSet([...new Set([...tags, tagToAdd])]);
			tagIpt.current!.focus();
			lastUsedTagsSet([...new Set([tagToAdd, ...lastUsedTags])].slice(0, 5));
			tagFilterSet('');
			tagIndexSet(-1);
		},
		[suggestedTags, tagIndex, trimmedFilter, tags, lastUsedTags],
	);
	const writeThought = useCallback(
		(ctrlKey?: boolean, altKey?: boolean) => {
			const content = contentTextArea.current!.value;
			if (!content || !personas) return;
			jsonString && navigate(pathname, { replace: true });
			contentTextArea.current!.style.height = 'auto';
			const additionalTag = ((suggestTags && suggestedTags[tagIndex]) || tagFilter).trim();
			const trimmedContent = content.trim();
			ping<{
				defaultNames: Record<string, string>;
				mentionedThoughts: Record<string, Thought>;
				thought: Thought;
			}>(
				buildUrl('write-thought'),
				post({
					parentId,
					...(editId
						? { editId }
						: { authorId: activePersona?.id || '', spaceId: activeSpace?.id || '' }),
					content: isJsonRecord(trimmedContent)
						? (() => {
								const obj = JSON.parse(trimmedContent);
								Object.entries(obj).forEach(([key, val]) => {
									if (typeof val !== 'string')
										obj[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
								});
								return obj;
							})()
						: separateMentions(trimmedContent),
					tags: sortUniArr([...tags, additionalTag].filter((a) => !!a)),
				}),
			)
				.then((res) => {
					console.log('res:', res);
					defaultNamesSet({ ...defaultNames, ...res.defaultNames });
					mentionedThoughtsSet({ ...mentionedThoughts, ...res.mentionedThoughts });
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
		[
			activePersona,
			activeSpace,
			jsonString,
			suggestedTags,
			tagIndex,
			tagFilter,
			editId,
			parentId,
			personas,
			onWrite,
			tags,
		],
	); //

	useKeyPress(
		{ key: 'Enter', modifiers: ['Meta', 'Alt', 'Control'] },
		(e) => {
			// console.log('e:', e);
			const focusedOnThoughtWriter =
				document.activeElement === contentTextArea.current ||
				document.activeElement === tagIpt.current;
			if (focusedOnThoughtWriter) {
				writeThought(e.ctrlKey, e.altKey);
			}
		},
		[suggestedTags, writeThought],
	);

	const defaultValue = useMemo(() => {
		const initialStuff = initialContent || jsonParam?.initialContent;
		return Array.isArray(initialStuff)
			? initialStuff.join('')
			: isStringRecord(initialStuff)
				? JSON.stringify(initialStuff, null, 2)
				: (initialStuff as string) || '';
	}, []);

	return (
		<div className="w-full flex flex-col">
			{freeForm ? (
				<TextareaAutoHeight
					autoFocus
					defaultValue={defaultValue}
					ref={contentTextArea}
					onFocus={(e) => {
						// focuses on the end of the input value when editing
						const tempValue = e.target.value;
						e.target.value = '';
						e.target.value = tempValue;
					}}
					name="content"
					placeholder="New thought"
					className="rounded text-xl font-thin font-mono px-3 py-2 w-full max-w-full resize-y min-h-36 bg-mg1 transition brightness-[0.97] dark:brightness-75 focus:brightness-100 focus:dark:brightness-100"
					onKeyDown={(e) => {
						if (e.key === 'Escape') {
							const ok =
								onContentBlur &&
								(contentTextArea.current?.value === defaultValue ||
									confirm(`You are about to discard this draft`));
							if (ok) {
								contentTextArea.current?.blur();
								onContentBlur && onContentBlur();
							}
						}
						// if (e.key === 'Tab' && !e.shiftKey) {
						// 	e.preventDefault();
						// 	tagIpt.current?.focus();
						// }
					}}
				/>
			) : (
				<FieldsEditor />
			)}
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
					onClick={() => suggestTagsSet(true)}
					onFocus={() => suggestTagsSet(true)}
					value={tagFilter}
					onChange={(e) => {
						tagSuggestionsRefs.current[0]?.focus();
						tagIpt.current?.focus();
						tagIndexSet(!e.target.value.length && tags.length ? -1 : 0);
						suggestTagsSet(true);
						tagFilterSet(e.target.value);
					}}
					onKeyDown={(e) => {
						e.key === 'Enter' && !(e.metaKey || e.altKey || e.ctrlKey) && addTag();
						e.key === 'Tab' && suggestTagsSet(false);
						e.key === 'Escape' &&
							(suggestTags ? suggestTagsSet(false) : contentTextArea.current?.focus());
						if (e.key === 'ArrowUp') {
							e.preventDefault();
							const index = Math.max(tagIndex - 1, -1);
							tagSuggestionsRefs.current[index]?.focus();
							tagIpt.current?.focus();
							tagIndexSet(index);
						}
						if (e.key === 'ArrowDown') {
							e.preventDefault();
							const index = Math.min(tagIndex + 1, suggestedTags!.length - 1);
							tagSuggestionsRefs.current[index]?.focus();
							tagIpt.current?.focus();
							tagIndexSet(index);
						}
					}}
					onBlur={() => {
						setTimeout(() => {
							if (
								document.activeElement !== tagIpt.current &&
								!tagSuggestionsRefs.current.find((e) => e === document.activeElement)
							) {
								tagIndexSet(0);
								suggestTagsSet(false);
							}
						}, 0);
					}}
				/>
				{suggestTags && (
					<div className="z-20 flex flex-col overflow-scroll rounded-b mt-0.5 bg-mg1 absolute w-full max-h-56 shadow">
						{suggestedTags.map((tag, i) => {
							return (
								<button
									key={i}
									ref={(r) => (tagSuggestionsRefs.current[i] = r)}
									className={`fx px-3 text-nowrap text-xl hover:bg-mg2 ${tagIndex === i ? 'bg-mg2' : 'bg-mg1'}`}
									onClick={() => addTag(tag)}
								>
									{tag}
								</button>
							);
						})}
					</div>
				)}
			</div>
			<div className="mt-1 fx justify-end gap-1.5">
				{/* <button
					className="px-2.5 p-0.5 transition text-fg2 hover:text-fg1"
					onClick={() => freeFormSet(!freeForm)}
				>
					{freeForm ? (
						<ChatBubbleBottomCenterTextIcon className="h-6 w-6" />
					) : (
						<ListBulletIcon className="h-6 w-6" />
					)}
				</button> */}
				{/* <button
					//  TODO: upload files
					className="px-2.5 p-0.5 transition text-fg2 hover:text-fg1"
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
