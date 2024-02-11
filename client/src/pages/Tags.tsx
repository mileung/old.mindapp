import { useCallback, useMemo, useRef, useState } from 'react';
import { buildUrl, pinger, usePinger } from '../utils/api';
import { PlusIcon, ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/react/16/solid';
import InputAutoWidth from '../components/InputAutoWidth';
import { RecTag, Tag, makeRecTags } from '../utils/tags';
import { tagsUse } from '../components/GlobalState';

const TagAdder = ({ onAdd, onBlur }: { onAdd: (label: string) => void; onBlur?: () => void }) => {
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
				placeholder="Make tags with Enter"
				className="h-8 min-w-[15rem] border-b-2 text-xl font-medium transition border-mg2 hover:border-fg2 focus:border-fg2"
				onKeyDown={(e) => {
					e.key === 'Enter' && addTag();
					e.key === 'Escape' && inputRef.current?.blur();
				}}
				onBlur={onGroupBlur}
			/>
			<button ref={buttonRef} className="group w-8 xy" onClick={addTag} onBlur={onGroupBlur}>
				<PlusIcon className="h-7 w-7 transition text-fg2 group-hover:text-fg1 group-focus:text-fg1" />
			</button>
		</div>
	);
};

const TagEditor = ({
	tag,
	parentLabel,
	onRename,
	onSubset,
	onRemove,
}: {
	tag: RecTag;
	parentLabel?: string;
	onRename: (oldLabel: string, newLabel: string) => void;
	onSubset: (label: string, parentLabel: string) => void;
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
		<div className="">
			<div className="fx">
				<InputAutoWidth
					size={1}
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
						onAdd={(label) => onSubset(label, tag.label)}
						onBlur={() => addingSubLabelSet(false)}
					/>
				)}
				{tag.recSubTags?.map((subtag) => (
					<TagEditor
						key={subtag.label}
						parentLabel={tag.label}
						tag={subtag}
						onRename={onRename}
						onSubset={onSubset}
						onRemove={onRemove}
					/>
				))}
			</div>
		</div>
	);
};

export default function Tags() {
	const [tags, tagsSet] = tagsUse();
	const recTags = useMemo(() => {
		if (tags) return makeRecTags(tags);
	}, [tags]);
	const refreshTags = useCallback(() => {
		pinger<Tag[]>(buildUrl('get-tags'))
			.then((data) => tagsSet(data))
			.catch((err) => alert('Error: ' + JSON.stringify(err)));
	}, []);

	const addTag = useCallback((label: string) => {
		pinger(buildUrl('add-tag'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ label }),
		})
			.then(refreshTags)
			.catch((err) => alert('Error: ' + JSON.stringify(err)));
	}, []);

	return (
		<div className="p-3">
			<TagAdder onAdd={addTag} />
			{recTags?.length ? (
				recTags.map((tag) => {
					return (
						<TagEditor
							key={tag.label}
							tag={tag}
							onSubset={(label, parentLabel) => {
								pinger(buildUrl('add-tag'), {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ label, parentLabels: [parentLabel] }),
								})
									.then(refreshTags)
									.catch((err) => alert('Error: ' + JSON.stringify(err)));
							}}
							onRename={(oldLabel, newLabel) => {
								pinger(buildUrl('rename-tag'), {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ oldLabel, newLabel }),
								})
									.then(refreshTags)
									.catch((err) => alert('Error: ' + JSON.stringify(err)));
							}}
							onRemove={(currentTagLabel, parentLabel) => {
								pinger(buildUrl('remove-tag'), {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ currentTagLabel, parentLabel }),
								})
									.then(refreshTags)
									.catch((err) => alert('Error: ' + JSON.stringify(err)));
							}}
						/>
					);
				})
			) : (
				<p className="text-xl">No tags</p>
			)}
		</div>
	);
}
