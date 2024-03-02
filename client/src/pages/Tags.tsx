import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildUrl, ping, post } from '../utils/api';
import {
	PlusIcon,
	ArrowTopRightOnSquareIcon,
	XMarkIcon,
	TrashIcon,
	ChevronRightIcon,
} from '@heroicons/react/16/solid';
import InputAutoWidth from '../components/InputAutoWidth';
import { RecTag, Tag, makeRecTags } from '../utils/tags';
import { useTags } from '../components/GlobalState';
import { matchSorter } from 'match-sorter';

const focusId = (className: string) => {
	setTimeout(() => {
		const node = document.getElementById(className);
		if (!node) return alert(`No id "${className}"`);
		// node.scrollIntoView({ behavior: 'smooth', block: 'center' });
		node.focus();
	}, 0);
};

function toKebabCase(input: string): string {
	return input.replace(/\s+/g, '-').toLowerCase();
}

export default function Tags() {
	const [tags, tagsSet] = useTags();
	const [selectedLabel, selectedLabelSet] = useState('');
	const [searchText, searchTextSet] = useState('');
	const tagInput = useRef<null | HTMLInputElement>(null);
	const tagSuggestionsRefs = useRef<(null | HTMLButtonElement)[]>([]);
	const suggestedTags = useMemo(() => {
		const tagFilter = searchText.trim().replace(/\s\s+/g, ' ');
		return matchSorter(tags?.map((a) => a.label) || [], tagFilter);
	}, [searchText, tags]);
	const recTags = useMemo(() => {
		if (tags && selectedLabel) return makeRecTags(tags, selectedLabel);
	}, [tags, selectedLabel]);
	const lastFocusedTagEditor = useRef<null | HTMLInputElement>(null);

	const refreshTags = useCallback(() => {
		return ping<Tag[]>(buildUrl('get-tags'))
			.then((data) => tagsSet(data))
			.catch((err) => alert(JSON.stringify(err)));
	}, []);

	const addTag = useCallback(
		(label: string) => {
			ping(buildUrl('add-tag'), post({ label }))
				.then(refreshTags)
				.then(() => {
					selectedLabelSet(label);
					focusId(toKebabCase(label + '-root-tag-editor'));
				})
				.catch((err) => alert(JSON.stringify(err)));
		},
		[refreshTags],
	);

	const addSubtag = useCallback(
		(label: string, parentLabel: string) => {
			ping(buildUrl('add-tag'), post({ label, parentLabel }))
				.then(refreshTags)
				.catch((err) => alert(JSON.stringify(err)));
		},
		[refreshTags],
	);

	const renameTag = useCallback(
		(oldLabel: string, newLabel: string) => {
			ping(buildUrl('rename-tag'), post({ oldLabel, newLabel }))
				.then(refreshTags)
				.then(() => focusId(toKebabCase(newLabel + '-root-tag-editor')))
				.catch((err) => alert(JSON.stringify(err)));
		},
		[refreshTags],
	);

	const removeTag = useCallback(
		(tagLabel: string, parentLabel?: string) => {
			selectedLabelSet('');
			ping(buildUrl('remove-tag'), post({ tagLabel, parentLabel }))
				.then(refreshTags)
				.catch((err) => alert(JSON.stringify(err)));
		},
		[refreshTags],
	);

	return (
		<div className="flex">
			<div className="flex-1 relative min-w-80">
				<div className="sticky top-12 h-full flex flex-col max-h-[calc(100vh-3rem)]">
					<div className="w-full px-3">
						<input
							ref={tagInput}
							autoFocus
							size={1}
							placeholder="Make tags with Enter"
							className="w-full h-8 border-b-2 text-xl font-medium transition border-mg2 hover:border-fg2 focus:border-fg2"
							value={searchText}
							onChange={(e) => searchTextSet(e.target.value)}
							onKeyDown={(e) => {
								e.key === 'Escape' && tagInput.current?.blur();
								if (searchText && e.key === 'Enter' && !e.metaKey) {
									addTag(searchText);
									searchTextSet('');
								}
								if (e.key === 'ArrowDown') {
									e.preventDefault();
									tagSuggestionsRefs.current[0]?.focus();
								}
							}}
						/>
					</div>
					<div className="flex-1 pb-1.5 overflow-scroll">
						{!tags ? null : !tags.length ? (
							<p className="text-xl">No tags</p>
						) : (
							suggestedTags.map((label, i) => {
								const selected = selectedLabel === label;
								const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
									if (e.key === 'ArrowUp') {
										e.preventDefault();
										!i ? tagInput.current?.focus() : tagSuggestionsRefs.current[i - 1]?.focus();
									} else if (e.key === 'ArrowDown') {
										e.preventDefault();
										tagSuggestionsRefs.current[i + 1]?.focus();
									} else if (!['Enter', 'Tab', 'Shift'].includes(e.key)) {
										tagInput.current?.focus();
									}
								};
								const cycle = (up?: boolean) => {
									const duplicateTags = document.getElementsByClassName(
										toKebabCase(label + '-tag-editor'),
									);
									const focusedIndex = [...duplicateTags].findIndex(
										(node) => node === lastFocusedTagEditor.current,
									);
									let nextI: number;
									if (focusedIndex === -1) {
										nextI = up ? duplicateTags.length - 1 : 0;
									} else {
										nextI = focusedIndex + (up ? -1 : 1);
										if (up && nextI === -1) {
											nextI = duplicateTags.length - 1;
										} else if (!up && nextI === duplicateTags.length) {
											nextI = 0;
										}
									}
									const inputTag = duplicateTags[nextI] as HTMLInputElement;
									inputTag.focus();
									lastFocusedTagEditor.current = inputTag;
								};
								return (
									<div key={label} className="flex">
										<button
											className="group flex-1 pl-3 truncate fx text-xl -outline-offset-2"
											ref={(r) => (tagSuggestionsRefs.current[i] = r)}
											onKeyDown={onKeyDown}
											onClick={() => {
												selectedLabelSet(label);
												selected && cycle();
											}}
										>
											<div className="flex-1 text-left text-xl font-medium transition text-fg1 truncate">
												{label}
											</div>
											<div
												className={`transition opacity-0 ${selected ? 'opacity-100 text-fg2 group-hover:text-fg1' : 'opacity-0 group-hover:opacity-100'}`}
											>
												<ChevronRightIcon
													className={`h-6 text-fg2 transition ${selected && 'rotate-90'}`}
												/>
											</div>
										</button>
									</div>
								);
							})
						)}
					</div>
				</div>
			</div>
			<div
				className="p-3 pt-0 flex-[2] border-l-2 border-mg2 min-h-[calc(100vh-3rem)] overflow-scroll"
				// TODO: horizontal drag to resize
			>
				{!selectedLabel ? (
					<div className="xy h-full">
						<p className="text-fg2 font-medium text-2xl">Expanded tag view</p>
					</div>
				) : (
					recTags && (
						<div className="">
							{/* {recTags!.map((tag) => {
							return (
								<TagEditor
									key={tag.label}
									tag={tag}
									onSubtag={addSubtag}
									onRename={renameTag}
									onRemove={removeTag}
								/>
							);
						})} */}
							<TagEditor
								root
								tag={recTags}
								onSubtag={addSubtag}
								onRename={renameTag}
								onRemove={removeTag}
							/>
						</div>
					)
				)}
			</div>
		</div>
	);
}

const TagAdder = ({ onAdd, onBlur }: { onAdd: (label: string) => void; onBlur?: () => void }) => {
	const [adding, addingSet] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	const onGroupBlur = useCallback(() => {
		setTimeout(() => {
			if (
				document.activeElement !== inputRef.current &&
				document.activeElement !== buttonRef.current
			) {
				onBlur && onBlur();
			}
		}, 0);
		addingSet(false);
	}, [onBlur]);

	const addTag = useCallback(() => {
		const value = inputRef.current!.value.trim();
		if (value) {
			onAdd(value);
			inputRef.current!.value = '';
		}
	}, [onAdd]);

	return (
		<div className="flex">
			<InputAutoWidth
				ref={inputRef}
				autoFocus
				size={1}
				onFocus={() => addingSet(true)}
				placeholder="Make tags with Enter"
				className="h-8 min-w-[15rem] border-b-2 text-xl font-medium transition border-mg2 hover:border-fg2 focus:border-fg2"
				onKeyDown={(e) => {
					e.key === 'Enter' && addTag();
					e.key === 'Escape' && inputRef.current?.blur();
				}}
				onBlur={onGroupBlur}
			/>
			{adding && (
				<button ref={buttonRef} className="group w-8 xy" onClick={addTag} onBlur={onGroupBlur}>
					<PlusIcon className="h-7 w-7 transition text-fg2 group-hover:text-fg1 group-focus:text-fg1" />
				</button>
			)}
		</div>
	);
};

const TagEditor = ({
	root,
	tag,
	parentLabel,
	onRename,
	onSubtag,
	onRemove,
}: {
	root?: boolean;
	tag: RecTag;
	parentLabel?: string;
	onRename: (oldLabel: string, newLabel: string) => void;
	onSubtag: (label: string, parentLabel: string) => void;
	onRemove: (currentTagLabel: string, parentLabel?: string) => void;
}) => {
	const [addingSubset, addingSubLabelSet] = useState(false);
	const [editing, editingSet] = useState(false);
	const inputRef = useRef<null | HTMLInputElement>(null);
	const makeSubsetRef = useRef<HTMLButtonElement>(null);
	const xRef = useRef<HTMLButtonElement>(null);

	const onBlur = useCallback(() => {
		setTimeout(() => {
			if (
				document.activeElement !== inputRef.current &&
				document.activeElement !== makeSubsetRef.current &&
				document.activeElement !== xRef.current
			) {
				editingSet(false);
				inputRef.current!.value = tag.label;
			}
		}, 0);
	}, []);

	useEffect(() => {
		inputRef.current && (inputRef.current.value = tag.label);
	}, [tag.label]);

	return (
		<div>
			<div className="fx">
				<InputAutoWidth
					size={1}
					ref={inputRef}
					defaultValue={tag.label}
					id={root ? toKebabCase(tag.label + '-root-tag-editor') : undefined}
					placeholder="Edit tag with Enter"
					className={`${toKebabCase(tag.label + '-tag-editor')} h-8 min-w-[15rem] border-b-2 text-xl font-medium transition border-bg1 hover:border-mg2 focus:border-fg2`}
					onBlur={onBlur}
					onFocus={() => editingSet(true)}
					onKeyDown={(e) => {
						e.key === 'Escape' && (editingSet(false), inputRef.current?.blur());
						if (e.key === 'Enter') {
							const newLabel = inputRef.current!.value.trim();
							if (newLabel) {
								if (tag.label !== newLabel) {
									onRename(tag.label, newLabel);
									inputRef.current?.blur();
								}
							} else {
								alert(`Can't rename tags to be empty strings`);
							}
							inputRef.current?.blur();
						}
					}}
				/>
				{editing && (
					<>
						<button
							className="xy h-8 w-8 group"
							title="Make subtags"
							ref={makeSubsetRef}
							onClick={() => {
								addingSubLabelSet(true);
								editingSet(false);
							}}
						>
							<ArrowTopRightOnSquareIcon className="h-6 w-6 mt-1 rotate-90 transition text-fg2 group-hover:text-fg1" />
						</button>
						<button
							className="xy h-8 w-8 group"
							ref={xRef}
							title={
								parentLabel
									? `Unlink "${tag.label}" from "${parentLabel}"`
									: `Delete "${tag.label}" and its descendants`
							}
							onClick={() => {
								onRemove(tag.label, parentLabel);
								editingSet(false);
							}}
							onKeyDown={(e) => e.key === 'Tab' && editingSet(false)}
						>
							{parentLabel ? (
								<XMarkIcon className="h-7 w-7 transition text-fg2 group-hover:text-fg1" />
							) : (
								<TrashIcon className="h-5 w-5 transition text-fg2 group-hover:text-fg1" />
							)}
						</button>
					</>
				)}
			</div>
			<div className="pl-3 border-l-2 border-fg2">
				{addingSubset && (
					<TagAdder
						onAdd={(label) => onSubtag(label, tag.label)}
						onBlur={() => addingSubLabelSet(false)}
					/>
				)}
				{tag.recSubTags?.map((subtag) => (
					<TagEditor
						key={subtag.label}
						parentLabel={tag.label}
						tag={subtag}
						onRename={onRename}
						onSubtag={onSubtag}
						onRemove={onRemove}
					/>
				))}
			</div>
		</div>
	);
};
