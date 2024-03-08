import { ArrowTopRightOnSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/16/solid';
import { useCallback, useEffect, useRef, useState } from 'react';
import InputAutoWidth from '../components/InputAutoWidth';
import { RecursiveTag, sortUniArr } from '../utils/tags';
import { useNavigate } from 'react-router-dom';
import { useTagTree } from './GlobalState';

const TagEditor = ({
	parentRef,
	subTaggingLineage,
	recTag,
	parentTag,
	onRename,
	onSubtag,
	onRemove,
	onKeyDown,
}: {
	parentRef?: React.MutableRefObject<HTMLInputElement | null>;
	subTaggingLineage: string;
	recTag: RecursiveTag;
	parentTag?: string;
	onRename: (oldTag: string, newTag: string, subTaggingLineage?: string) => Promise<any>;
	onSubtag: (tag: string, parentTag: string, subTaggingLineage?: string) => Promise<any>;
	onRemove: (currentTagLabel: string, parentTag?: string) => void;
	onKeyDown?: React.DOMAttributes<HTMLInputElement>['onKeyDown'];
}) => {
	const navigate = useNavigate();
	const [tagTree, tagTreeSet] = useTagTree();
	const [addingSubtag, addingSubtagSet] = useState(false);
	const [editing, editingSet] = useState(false);
	const editingIpt = useRef<null | HTMLInputElement>(null);
	const makeSubsetBtn = useRef<HTMLButtonElement>(null);
	const removeBtn = useRef<HTMLButtonElement>(null);
	const addingIpt = useRef<HTMLInputElement>(null);

	const onEditingBlur = useCallback(() => {
		editingIpt.current!.value = recTag.label;
		setTimeout(() => {
			if (
				document.activeElement !== editingIpt.current &&
				document.activeElement !== makeSubsetBtn.current &&
				document.activeElement !== removeBtn.current
			) {
				editingSet(false);
			}
		}, 0);
	}, [recTag.label]);

	useEffect(() => {
		editingIpt.current && (editingIpt.current.value = recTag.label);
	}, [recTag.label]);

	useEffect(() => {
		addingSubtagSet(JSON.stringify(recTag.lineage) === subTaggingLineage);
	}, [recTag.lineage, subTaggingLineage]);

	return (
		<div>
			<div className="fx">
				<InputAutoWidth
					ref={(r: HTMLInputElement | null) => {
						editingIpt.current = r;
						parentRef && (parentRef.current = r);
					}}
					defaultValue={recTag.label}
					placeholder="Edit tag with Enter"
					className="h-8 min-w-[15rem] border-b-2 text-xl font-medium transition border-bg1 hover:border-mg2 focus:border-fg2"
					onBlur={onEditingBlur}
					onFocus={() => editingSet(true)}
					onKeyDown={(e) => {
						onKeyDown?.(e);
						e.key === 'Escape' && editingIpt.current?.blur();
						if (e.key === 'Enter') {
							const newTag = editingIpt.current!.value.trim();
							if (!newTag) return;
							editingIpt.current!.value = newTag;
							if (!parentTag) {
								if (tagTree?.branchNodes[recTag.label]) {
									tagTree!.branchNodes[newTag] = tagTree!.branchNodes[recTag.label];
									delete tagTree!.branchNodes[recTag.label];
								} else {
									tagTree!.leafNodes.splice(
										tagTree!.leafNodes.findIndex((tag) => tag === recTag.label),
										1,
									);
									tagTree!.leafNodes = sortUniArr(tagTree!.leafNodes.concat(newTag));
								}
								tagTreeSet(tagTree);
								navigate(`/tags/${encodeURIComponent(newTag)}`, { replace: true });
							}
							if (recTag.label === newTag) {
								addingSubtagSet(true);
								editingSet(false);
							} else {
								onRename(
									recTag.label,
									newTag,
									e.ctrlKey
										? JSON.stringify(
												recTag.lineage.slice(0, recTag.lineage.length - 1).concat(newTag),
											)
										: undefined,
								).then(() => setTimeout(() => editingIpt.current?.blur(), 0));
							}
						}
					}}
				/>
				{editing && (
					<>
						<button
							className="xy h-8 w-8 group"
							title="Add subtags"
							ref={makeSubsetBtn}
							onBlur={onEditingBlur}
							onClick={() => {
								addingSubtagSet(true);
								editingSet(false);
							}}
						>
							<ArrowTopRightOnSquareIcon className="h-6 w-6 mt-1 rotate-90 transition text-fg2 group-hover:text-fg1" />
						</button>
						<button
							className="xy h-8 w-8 group"
							ref={removeBtn}
							onBlur={onEditingBlur}
							onKeyDown={(e) => e.key === 'Tab' && !e.shiftKey && editingSet(false)}
							onClick={() => {
								const ok =
									!!parentTag || confirm(`You are about to delete the "${recTag.label}" tag`);
								editingIpt.current?.focus();
								ok && onRemove(recTag.label, parentTag);
							}}
						>
							{parentTag ? (
								<XMarkIcon className="h-7 w-7 transition text-fg2 group-hover:text-fg1" />
							) : (
								<TrashIcon className="h-5 w-5 transition text-fg2 group-hover:text-fg1" />
							)}
						</button>
					</>
				)}
			</div>
			<div className="pl-3 border-l-2 border-fg2">
				{addingSubtag && (
					<InputAutoWidth
						ref={addingIpt}
						autoFocus
						onFocus={() => addingSubtagSet(true)}
						placeholder="Add tags with Enter"
						className="h-8 min-w-[15rem] border-b-2 text-xl font-medium transition border-mg2 hover:border-fg2 focus:border-fg2"
						onKeyDown={(e) => {
							e.key === 'Escape' && addingIpt.current?.blur();
							if (e.key === 'Enter') {
								const newTag = addingIpt.current!.value.trim();
								if (!newTag) return;
								onSubtag(
									newTag,
									recTag.label,
									e.ctrlKey
										? JSON.stringify(recTag.lineage.concat(newTag))
										: JSON.stringify(recTag.lineage),
								).then(() => (addingIpt.current!.value = ''));
							}
						}}
						onBlur={() => addingSubtagSet(false)}
					/>
				)}
				{recTag.subRecTags?.map((subRecTag) => (
					<TagEditor
						key={subRecTag.label}
						subTaggingLineage={subTaggingLineage}
						parentTag={recTag.label}
						recTag={subRecTag}
						onRename={onRename}
						onSubtag={onSubtag}
						onRemove={onRemove}
					/>
				))}
			</div>
		</div>
	);
};

export default TagEditor;
