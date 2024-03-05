import { ChevronRightIcon } from '@heroicons/react/16/solid';
import { matchSorter } from 'match-sorter';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTagTree } from '../components/GlobalState';
import { buildUrl, ping, post } from '../utils/api';
import { TagTree, makeRootTag, sortUniArr } from '../utils/tags';
import TagEditor from '../components/TagEditor';

export default function Tags() {
	const navigate = useNavigate();
	const { tag } = useParams();
	useEffect(() => selectedLabelSet(tag || ''), [tag]);
	const [tagTree, tagTreeSet] = useTagTree();
	const [selectedLabel, selectedLabelSet] = useState(tag || '');
	const [searchText, searchTextSet] = useState('');
	const tagFilterIpt = useRef<null | HTMLInputElement>(null);
	const tagSuggestionsRefs = useRef<(null | HTMLAnchorElement)[]>([]);
	const subTaggingLineageRef = useRef('');
	const suggestedTags = useMemo(
		() =>
			matchSorter(Object.keys(tagTree?.branchNodes || []), searchText).concat(
				matchSorter(tagTree?.leafNodes || [], searchText),
			),
		[tagTree, searchText],
	);

	const tagDividerIndex = useMemo(
		() => tagTree && suggestedTags.length - tagTree.leafNodes.length,
		[tagTree, suggestedTags],
	);

	const rootTag = useMemo(() => {
		if (tagTree && selectedLabel) {
			if (tagTree.branchNodes[selectedLabel] || tagTree.leafNodes.includes(selectedLabel)) {
				return makeRootTag(tagTree, selectedLabel);
			}
		}
	}, [tagTree, selectedLabel]);

	const parentsMap = useMemo(() => {
		if (tagTree) {
			const obj: Record<string, string[]> = {};
			Object.entries(tagTree.branchNodes).forEach(([parentTag, subTags]) => {
				subTags.forEach((tag) => {
					obj[tag] = obj[tag] || [];
					obj[tag].push(parentTag);
				});
			});
			return obj;
		}
	}, [tagTree]);

	const rootParents = useMemo(
		() => !!(parentsMap && selectedLabel) && parentsMap[selectedLabel],
		[parentsMap, selectedLabel],
	);

	const refreshTags = useCallback(() => {
		return ping<TagTree>(buildUrl('get-tag-tree'))
			.then((data) => tagTreeSet(data))
			.catch((err) => alert(JSON.stringify(err)));
	}, []);

	const addRootTag = useCallback(
		(tag: string) => {
			tagTree!.leafNodes = sortUniArr(tagTree!.leafNodes.concat(tag));
			tagTreeSet(tagTree);
			ping(buildUrl('add-tag'), post({ tag })).catch((err) => alert(JSON.stringify(err)));
		},
		[tagTree, refreshTags],
	);

	const addSubtag = useCallback(
		(tag: string, parentTag: string, subTaggingLineage?: string) =>
			ping(buildUrl('add-tag'), post({ tag, parentTag }))
				.then(refreshTags)
				.then(() => subTaggingLineage && (subTaggingLineageRef.current = subTaggingLineage))
				.catch((err) => alert(JSON.stringify(err))),
		[refreshTags],
	);

	const renameTag = useCallback(
		(oldTag: string, newTag: string, subTaggingLineage?: string) =>
			ping(buildUrl('rename-tag'), post({ oldTag, newTag }))
				.then(refreshTags)
				.then(() => subTaggingLineage && (subTaggingLineageRef.current = subTaggingLineage))
				.catch((err) => alert(JSON.stringify(err))),
		[refreshTags],
	);

	const removeTag = useCallback(
		(tag: string, parentTag?: string) => {
			!parentTag && selectedLabelSet('');
			ping(buildUrl('remove-tag'), post({ tag, parentTag }))
				.then(refreshTags)
				.catch((err) => alert(JSON.stringify(err)));
		},
		[refreshTags],
	);

	return (
		<div className="flex">
			<div className="flex-1 relative min-w-80 max-w-[30rem]">
				<div className="sticky top-12 h-full flex flex-col max-h-[calc(100vh-3rem)]">
					<div className="w-full px-3">
						<input
							ref={tagFilterIpt}
							autoFocus
							size={1}
							placeholder="Add/Select tags with Enter"
							className="w-full h-8 border-b-2 text-xl font-medium transition border-mg2 hover:border-fg2 focus:border-fg2"
							value={searchText}
							onChange={(e) => searchTextSet(e.target.value)}
							onKeyDown={(e) => {
								e.key === 'Escape' && tagFilterIpt.current?.blur();
								const newTag = searchText.trim();
								if (newTag && e.key === 'Enter') {
									e.ctrlKey && (subTaggingLineageRef.current = JSON.stringify([newTag]));
									!suggestedTags.includes(newTag) && addRootTag(newTag);
									selectedLabelSet(newTag);
									navigate(`/tags/${encodeURIComponent(newTag)}`);
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
						{!tagTree ? null : !Object.keys(tagTree.branchNodes).length &&
						  !tagTree.leafNodes.length ? (
							<p className="mx-3 text-xl">No tags</p>
						) : (
							suggestedTags.map((tag, i) => {
								const selected = selectedLabel === tag;
								const onKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
									if (e.key === 'ArrowUp') {
										e.preventDefault();
										!i ? tagFilterIpt.current?.focus() : tagSuggestionsRefs.current[i - 1]?.focus();
									} else if (e.key === 'ArrowDown') {
										e.preventDefault();
										tagSuggestionsRefs.current[i + 1]?.focus();
									} else if (!['Control', 'Alt', 'Tab', 'Shift', 'Meta', 'Enter'].includes(e.key)) {
										tagFilterIpt.current?.focus();
									}
								};
								return (
									<React.Fragment key={`${tag}-${i < (tagDividerIndex || 0) ? 'branch' : 'leaf'}`}>
										{!i && !!tagDividerIndex && (
											<div className="z-10 sticky top-0 bg-bg2 px-3 font-bold text-fg2">
												Branch nodes
											</div>
										)}
										{i === tagDividerIndex && (
											<div
												className={`${tagDividerIndex && 'mt-3'} z-10 sticky top-0 bg-bg2 px-3 font-bold text-fg2`}
											>
												Leaf nodes
											</div>
										)}
										<Link
											to={`/tags/${encodeURIComponent(tag)}`}
											className="group flex-1 pl-3 truncate fx text-xl -outline-offset-2"
											ref={(r) => (tagSuggestionsRefs.current[i] = r)}
											onKeyDown={onKeyDown}
											onClick={() => selectedLabelSet(tag)}
										>
											<div className="flex-1 text-left text-xl font-medium transition text-fg1 truncate">
												{tag}
											</div>
											<div
												className={`transition ${selected ? 'text-fg1' : 'text-bg1 group-hover:text-fg2'}`}
											>
												<ChevronRightIcon className="h-6" />
											</div>
										</Link>
									</React.Fragment>
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
				) : !rootTag ? (
					tag &&
					tagTree && (
						<div className="">
							<p className="text-xl">"{tag}" is not a tag</p>
						</div>
					)
				) : (
					<>
						{rootParents && (
							<div className="mb-1 fx gap-2">
								{rootParents.map((tag) => (
									<Link
										key={tag}
										to={`/tags/${encodeURIComponent(tag)}`}
										className="text-lg font-semibold rounded px-2 border-2 transition hover:text-fg1 text-fg2 border-fg2"
									>
										{tag}
									</Link>
								))}
							</div>
						)}
						<TagEditor
							subTaggingLineage={subTaggingLineageRef.current}
							recTag={rootTag}
							onSubtag={addSubtag}
							onRename={renameTag}
							onRemove={removeTag}
						/>
					</>
				)}
			</div>
		</div>
	);
}
