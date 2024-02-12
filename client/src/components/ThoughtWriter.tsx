import { CheckCircleIcon, PlusIcon, XCircleIcon } from '@heroicons/react/16/solid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tagsUse, personaUse } from './GlobalState';
import { buildUrl, pinger } from '../utils/api';
import { matchSorter } from 'match-sorter';
import { Tag } from '../utils/tags';

export const ThoughtWriter = ({
	editId,
	parentId,
	onLink,
}: {
	editId?: string;
	parentId?: string;
	onLink?: () => void;
}) => {
	const [tags, tagsSet] = tagsUse();
	const [personaId] = personaUse();
	const [thoughtTags, thoughtTagsSet] = useState<string[]>([]);
	const [tagFilter, tagFilterSet] = useState('');
	const [suggestTags, suggestTagsSet] = useState(false);
	const contentTextArea = useRef<null | HTMLTextAreaElement>(null);
	const tagInput = useRef<null | HTMLInputElement>(null);
	const tagXs = useRef<(null | HTMLButtonElement)[]>([]);
	const tagSuggestionsRefs = useRef<(null | HTMLButtonElement)[]>([]);

	const filteredTags = useMemo(() => {
		return matchSorter(tags?.map((a) => a.label) || [], tagFilter);
	}, [tags, tagFilter]);

	const writeThought = useCallback(
		(additionalTags: string[] = []) => {
			if (!contentTextArea.current!.value) return;
			pinger<{ createDate: number }>(buildUrl('write-thought'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					parentId,
					thought: {
						createDate: +editId?.split('.')[0]! || undefined,
						authorId: personaId,
						spaceId: null,
						content: contentTextArea.current!.value,
						tags: [...thoughtTags, ...additionalTags],
					},
				}),
			})
				.then(() => {
					// caching is premature optimization atm. Just ping local sever to update ui
					onLink && onLink();
					contentTextArea.current!.value = '';
					thoughtTagsSet([]);
					suggestTagsSet(false);
				})
				.catch((err) => alert(JSON.stringify(err)));

			let addedNewTags = false;
			thoughtTags.forEach((label) => {
				if (!tags!.find(({ label: labelOnDisk }) => labelOnDisk === label)) {
					addedNewTags = true;
					pinger(buildUrl('add-tag'), {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ label }),
					}).catch((err) => alert(JSON.stringify(err)));
				}
			});
			if (addedNewTags) {
				pinger<Tag[]>(buildUrl('get-tags'))
					.then((data) => tagsSet(data))
					.catch((err) => alert(JSON.stringify(err)));
			}
		},
		[editId, parentId, onLink, thoughtTags]
	);

	const onAddingTagBlur = useCallback(() => {
		setTimeout(() => {
			const focusedOnTagOptions = tagSuggestionsRefs.current.includes(
				// @ts-ignore
				document.activeElement
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
					(e) => e === document.activeElement
				);
				const focusedOnThoughtWriter =
					document.activeElement === contentTextArea.current ||
					document.activeElement === tagInput.current ||
					focusedSuggestionIndex !== -1;

				if (focusedOnThoughtWriter) {
					writeThought(
						[tags![focusedSuggestionIndex]?.label, tagInput.current!.value].filter((e) => !!e)
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
	}, [tags, writeThought]);

	return (
		<div className="w-full flex flex-col">
			<textarea
				autoFocus
				ref={contentTextArea}
				name="content"
				placeholder="New thought"
				className="rounded text-xl font-medium p-3 w-full max-w-full resize-y bg-mg1 transition brightness-75 focus:brightness-100"
			/>
			<div className="mt-1 relative">
				{!!thoughtTags.length && (
					<div
						className="mb-0.5 fx flex-wrap px-3 py-1 gap-1 rounded-t bg-bg2 text-lg"
						onClick={() => tagInput.current!.focus()}
					>
						{thoughtTags.map((name, i) => {
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
											const newCats = [...thoughtTags];
											newCats.splice(i, 1);
											thoughtTagsSet(newCats);
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
					className={`px-3 py-1 text-xl bg-mg1 w-full overflow-hidden transition brightness-75 focus:brightness-100 ${thoughtTags.length ? '' : 'rounded-t'} ${suggestTags ? '' : 'rounded-b'}`}
					placeholder="Add tags with Enter"
					ref={tagInput}
					onFocus={() => suggestTagsSet(true)}
					onBlur={onAddingTagBlur}
					onClick={() => suggestTagsSet(true)}
					onChange={(e) => tagFilterSet(e.target.value.trim().replace(/\s\s+/g, ' '))}
					onKeyDown={(e) => {
						if (tagFilter && e.key === 'Enter' && !e.metaKey) {
							tagInput.current!.value = '';
							thoughtTagsSet([...new Set([...thoughtTags, tagFilter])]);
							tagFilterSet('');
						} else if (e.key === 'Escape') {
							suggestTagsSet(!suggestTags);
						}
					}}
				/>
				{suggestTags && (
					<div className="z-20 flex flex-col overflow-scroll rounded-b mt-0.5 bg-mg1 absolute w-full max-h-56 shadow">
						{filteredTags.map((label, i) => {
							const tagIndex = thoughtTags.indexOf(label);
							const inThoughtTags = tagIndex !== -1;
							return (
								<button
									key={i}
									className="fx px-3 text-xl -outline-offset-2 transition hover:bg-mg2"
									ref={(r) => (tagSuggestionsRefs.current[i] = r)}
									onBlur={onAddingTagBlur}
									onKeyDown={(e) => e.key === 'Escape' && suggestTagsSet(false)}
									onClick={() => {
										if (inThoughtTags) {
											const newThoughtTags = [...thoughtTags];
											newThoughtTags.splice(tagIndex, 1);
											thoughtTagsSet(newThoughtTags);
										} else {
											thoughtTagsSet([...new Set([...thoughtTags, label])]);
										}
									}}
								>
									{label} {inThoughtTags && <CheckCircleIcon className="ml-1 h-3.5 w-3.5" />}
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
