import { useCallback, useMemo, useRef, useState } from 'react';
import { buildUrl, ping, post } from '../utils/api';
import { PlusIcon, ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/react/16/solid';
import InputAutoWidth from '../components/InputAutoWidth';
import { RecTag, Tag, makeRecTags } from '../utils/tags';
import { useTags } from '../components/GlobalState';

const focusId = (id: string) => {
	setTimeout(() => {
		const node = document.getElementById(id);
		if (!node) return alert(`No id "${id}"`);
		// node.scrollIntoView({ behavior: 'smooth', block: 'center' });
		node.focus();
	}, 0);
};

function toKebabCase(input: string): string {
	return input.replace(/\s+/g, '-').toLowerCase();
}

export default function Tags() {
	const [tags, tagsSet] = useTags();
	const recTags = useMemo(() => tags && makeRecTags(tags), [tags]);

	const refreshTags = useCallback(() => {
		return ping<Tag[]>(buildUrl('get-tags'))
			.then((data) => tagsSet(data))
			.catch((err) => alert(JSON.stringify(err)));
	}, []);

	const addTag = useCallback(
		(label: string) => {
			ping(buildUrl('add-tag'), post({ label }))
				.then(refreshTags)
				.then(() => focusId(toKebabCase(label + '-tag-editor')))
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
				.then(() => focusId(toKebabCase(newLabel + '-tag-editor')))
				.catch((err) => alert(JSON.stringify(err)));
		},
		[refreshTags],
	);

	const removeTag = useCallback(
		(tagLabel: string, parentLabel?: string) => {
			ping(buildUrl('remove-tag'), post({ tagLabel, parentLabel }))
				.then(refreshTags)
				.catch((err) => alert(JSON.stringify(err)));
		},
		[refreshTags],
	);

	return (
		<div className="flex min-h-screen -mt-12">
			<div className="max-h-screen overflow-scroll pt-12 p-3 flex-1 min-w-80 max-w-96">
				<TagAdder onAdd={addTag} />
				{!recTags?.length ? (
					<p className="text-xl">No tags</p>
				) : (
					recTags.map((tag) => {
						return (
							<TagEditor
								key={tag.label}
								tag={tag}
								onSubtag={addSubtag}
								onRename={renameTag}
								onRemove={removeTag}
							/>
						);
					})
				)}
			</div>
			<div className="max-h-screen overflow-scroll pt-12 p-3 flex-[2] border-l-2 border-mg2">
				{!recTags?.length ? (
					<div className="xy h-full">
						<p className="text-fg2 text-xl">Expanded tree view</p>
					</div>
				) : (
					recTags.map((tag) => {
						return (
							<TagEditor
								expand
								id={toKebabCase(tag.label + '-tag-editor')}
								key={tag.label}
								tag={tag}
								onSubtag={addSubtag}
								onRename={renameTag}
								onRemove={removeTag}
							/>
						);
					})
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
	id,
	tag,
	expand,
	parentLabel,
	onRename,
	onSubtag,
	onRemove,
}: {
	id?: string;
	tag: RecTag;
	expand?: boolean;
	parentLabel?: string;
	onRename: (oldLabel: string, newLabel: string) => void;
	onSubtag: (label: string, parentLabel: string) => void;
	onRemove: (currentTagLabel: string, parentLabel?: string) => void;
}) => {
	const [addingSubset, addingSubLabelSet] = useState(false);
	const [editing, editingSet] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
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

	return (
		<div>
			<div className="fx">
				<InputAutoWidth
					size={1}
					id={id}
					ref={inputRef}
					defaultValue={tag.label}
					placeholder="Edit tag with Enter"
					className="h-8 min-w-[15rem] border-b-2 text-xl font-medium transition border-bg1 hover:border-mg2 focus:border-fg2"
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
							onClick={() => {
								onRemove(tag.label, parentLabel);
								editingSet(false);
							}}
							onKeyDown={(e) => e.key === 'Tab' && editingSet(false)}
						>
							<XMarkIcon className="h-7 w-7 transition text-fg2 group-hover:text-fg1" />
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
				{expand &&
					tag.recSubTags?.map((subtag) => (
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
