import { useCallback, useMemo, useRef, useState } from 'react';
import { buildUrl, pinger, usePinger } from '../utils/api';
import { PlusIcon, ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/react/16/solid';
import InputAutoWidth from '../components/InputAutoWidth';
import { RecursiveTag, Tag, makeRecursiveTags } from '../utils/tags';

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
	onRename,
	onSubset,
	onDelete,
}: {
	tag: RecursiveTag;
	onRename: (oldLabel: string, newLabel: string) => void;
	onSubset: (label: string, parentLabel: string) => void;
	onDelete: (label: string) => void;
}) => {
	const [addingSubset, addingsubTagset] = useState(false);
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
					placeholder={`${editing ? 'Edit tag' : 'Make tags'} with Enter`}
					className="h-8 min-w-[15rem] border-b-2 text-xl font-medium transition border-bg1 hover:border-mg2 focus:border-fg2"
					onBlur={onBlur}
					onFocus={() => editingSet(true)}
					onKeyDown={(e) => {
						e.key === 'Escape' && (editingSet(false), inputRef.current?.blur());
						if (e.key === 'Enter') {
							const newLabel = inputRef.current!.value.trim();
							if (newLabel) {
								if (tag.label !== newLabel) {
									onRename(tag.label, newLabel, inputRef.current!.blur);
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
							title="Make subset tags"
							ref={makeSubsetRef}
							onClick={() => {
								addingsubTagset(true);
								editingSet(false);
							}}
						>
							<ArrowTopRightOnSquareIcon className="h-6 w-6 mt-1 rotate-90 transition text-fg2 group-hover:text-fg1" />
						</button>
						<button
							className="xy h-8 w-8 group"
							ref={xRef}
							onClick={() => {
								onDelete(tag.label);
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
						onBlur={() => addingsubTagset(false)}
					/>
				)}
				{tag.subTags?.map((subset) => (
					<TagEditor
						key={subset.label}
						tag={subset}
						onRename={onRename}
						onSubset={onSubset}
						onDelete={onDelete}
					/>
				))}
			</div>
		</div>
	);
};

export default function Tags() {
	const { data, refresh } = usePinger<Tag[]>(buildUrl('get-tags'));

	const recursiveTags = useMemo(() => {
		if (data) return makeRecursiveTags(data);
	}, [data]);

	const addTag = useCallback((label: string) => {
		// console.log('label:', label);
		pinger(buildUrl('add-tag'), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ label }),
		})
			.then((data) => {
				console.log('data', data);
				// tagRef.current!.value = '';
				refresh();
			})
			.catch((err) => {
				console.log('err', err);
			});
	}, []);

	return (
		<div className="p-3">
			<TagAdder onAdd={addTag} />
			{recursiveTags?.length ? (
				recursiveTags.map((tag) => {
					return (
						<TagEditor
							key={tag.label}
							tag={tag}
							onSubset={(label, parentLabel) => {
								pinger(buildUrl('add-tag'), {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ label, parentTags: [parentLabel] }),
								})
									.then(refresh)
									.catch((err) => {
										console.log('err', err);
									});
							}}
							onRename={(oldLabel, newLabel) => {
								console.log(oldLabel, newLabel);
								// pinger(buildUrl('rename-tag'), {
								// 	method: 'POST',
								// 	headers: { 'Content-Type': 'application/json' },
								// 	body: JSON.stringify({ oldName: tag, oldLabel, newLabel }),
								// });
							}}
							onDelete={(label) => {
								console.log(label);
								// pinger(buildUrl('delete-tag'), {
								// 	method: 'POST',
								// 	headers: { 'Content-Type': 'application/json' },
								// 	body: JSON.stringify({ tag }),
								// });
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
