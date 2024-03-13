import { ChevronRightIcon, PlusIcon } from '@heroicons/react/16/solid';
import { matchSorter } from 'match-sorter';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTagTree } from '../components/GlobalState';
import { buildUrl, ping, post } from '../utils/api';
import { TagTree, makeRootTag, sortUniArr } from '../utils/tags';
import TagEditor from '../components/TagEditor';
import { debounce } from '../utils/performance';
import { useKeyPress } from '../utils/keyboard';

export default function Tags() {
	const navigate = useNavigate();
	const { tag } = useParams();
	const [tagTree, tagTreeSet] = useTagTree();
	// let [tagTree, tagTreeSet] = useTagTree();
	// tagTree = { branchNodes: {}, leafNodes: [] };
	const [tagFilter, tagFilterSet] = useState('');
	const [tagIndex, tagIndexSet] = useState<null | number>(null);
	const searchIpt = useRef<null | HTMLInputElement>(null);
	const rootTagIpt = useRef<null | HTMLInputElement>(null);
	const tagSuggestionsRefs = useRef<(null | HTMLAnchorElement)[]>([]);
	const subTaggingLineageRef = useRef('');
	const tags = useMemo(
		() =>
			tagTree
				? {
						branch: Object.keys(tagTree.branchNodes),
						leaf: tagTree.leafNodes,
					}
				: null,
		[JSON.stringify(tagTree)],
	);
	const allTags = useMemo(() => tags && new Set(tags.branch.concat(tags.leaf)), [tags]);
	const showAddTag = useMemo(() => !!tagFilter && !allTags?.has(tagFilter), [allTags, tagFilter]);
	const suggestedTags = useMemo(() => {
		const arr =
			tags &&
			(tagFilter
				? matchSorter(tags.branch.concat(tags.leaf), tagFilter).concat(tagFilter)
				: matchSorter(tags.branch, tagFilter).concat(matchSorter(tags.leaf, tagFilter)));
		if (tagIndex === null) {
			tagIndexSet(tag && arr ? arr.indexOf(tag) : 0);
		}
		return arr;
	}, [tags, tagFilter, tagIndex]);

	const tagDividerIndex = useMemo(
		() => suggestedTags && tagTree && suggestedTags.length - tagTree.leafNodes.length,
		[tagTree, suggestedTags],
	);

	const rootTag = useMemo(() => {
		if (
			!tagTree ||
			!suggestedTags ||
			tagIndex === null ||
			tagIndex === -1 ||
			!suggestedTags ||
			(showAddTag && tagIndex === suggestedTags.length - 1) ||
			!suggestedTags[tagIndex]
		) {
			return null;
		}

		return makeRootTag(tagTree, suggestedTags[tagIndex]);
	}, [tagFilter, allTags, tag, tagIndex, tagTree, suggestedTags, showAddTag]);

	const onArrowUpOrDown = useCallback(
		(e: KeyboardEvent) => {
			if (
				(document.activeElement!.tagName === 'INPUT' &&
					document.activeElement !== searchIpt.current) ||
				tagIndex === null ||
				!suggestedTags
			)
				return;
			e.preventDefault();
			const index = Math.min(
				Math.max(tagIndex + (e.key === 'ArrowUp' ? -1 : 1), 0),
				suggestedTags.length - 1,
			);
			tagSuggestionsRefs.current[index]?.focus();
			searchIpt.current?.focus();
			tagIndexSet(index);
		},
		[tagIndex, suggestedTags],
	);
	useKeyPress({ key: 'ArrowDown', allowRepeats: true }, onArrowUpOrDown, [onArrowUpOrDown]);
	useKeyPress({ key: 'ArrowUp', allowRepeats: true }, onArrowUpOrDown, [onArrowUpOrDown]);

	const debouncedReplaceUrl = useCallback(
		debounce((path?: string) => {
			path && navigate(`/tags/${encodeURIComponent(path)}`, { replace: true });
		}, 100),
		[],
	);

	useEffect(() => debouncedReplaceUrl(rootTag?.label || tagFilter), [rootTag?.label, tagFilter]);
	useEffect(() => {
		subTaggingLineageRef.current = '';
	}, [tagIndex]);

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
		() => (!!(parentsMap && rootTag?.label) && parentsMap[rootTag?.label]) || [],
		[parentsMap, rootTag],
	);

	const refreshTags = useCallback(() => {
		return ping<TagTree>(buildUrl('get-tag-tree'))
			.then((data) => tagTreeSet(data))
			.catch((err) => alert(JSON.stringify(err)));
	}, []);

	const addRootTag = useCallback(
		(ctrlKey: boolean) => {
			const newTag = tagFilter.trim();
			tagTree!.leafNodes = sortUniArr(tagTree!.leafNodes.concat(newTag));
			tagTreeSet(tagTree);
			tagIndexSet(0);
			ping(buildUrl('add-tag'), post({ tag: newTag })).catch((err) => alert(JSON.stringify(err)));
			ctrlKey && (subTaggingLineageRef.current = JSON.stringify([newTag]));
			navigate(`/tags/${encodeURIComponent(newTag)}`, { replace: true });
		},
		[tagFilter, tagTree, refreshTags],
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
		async (oldTag: string, newTag: string, subTaggingLineage?: string) =>
			ping(buildUrl('rename-tag'), post({ oldTag, newTag }))
				.then(refreshTags)
				.then(() => subTaggingLineage && (subTaggingLineageRef.current = subTaggingLineage))
				.then(() => searchIpt.current?.focus())
				.catch((err) => alert(JSON.stringify(err))),
		[refreshTags],
	);

	const removeTag = useCallback(
		(tag: string, parentTag?: string) => {
			!parentTag && navigate('/tags', { replace: true });
			ping(buildUrl('remove-tag'), post({ tag, parentTag }))
				.then(refreshTags)
				.then(() => searchIpt.current?.focus())
				.catch((err) => alert(JSON.stringify(err)));
		},
		[refreshTags],
	);

	return (
		<div className="flex">
			<div className="flex-1 relative min-w-80 max-w-[30rem]">
				<div className="sticky top-12 h-full flex flex-col max-h-[calc(100vh-3rem)]">
					<input
						ref={searchIpt}
						autoFocus
						placeholder="Search tags"
						className="w-full px-3 h-8  border-b-2 text-xl font-medium transition border-mg2 hover:border-fg2 focus:border-fg2"
						value={tagFilter}
						onChange={(e) => {
							tagIndexSet(0);
							tagFilterSet(e.target.value);
						}}
						onKeyDown={(e) => {
							e.key === 'Escape' && searchIpt.current?.blur();
							if (e.key === 'Tab' && !e.shiftKey) {
								tagSuggestionsRefs.current[
									tagSuggestionsRefs.current.filter((a) => !!a).length - 1
								]?.focus();
								// TODO: prevent the flicker that sometimes happens when the tag suggestions are scrollable
								setTimeout(() => {
									const currentFocus = document.activeElement;
									tagSuggestionsRefs.current[0]?.focus();
									// @ts-ignore
									currentFocus?.focus();
								}, 0);
							}
							if (e.key === 'Enter' && suggestedTags) {
								if (tagIndex === suggestedTags.length - 1 && showAddTag) {
									addRootTag(e.ctrlKey);
								} else {
									e.preventDefault();
									rootTagIpt.current?.focus();
								}
							}
						}}
					/>
					<div className="flex-1 pb-1.5 overflow-scroll">
						{suggestedTags &&
							suggestedTags.map((tag, i) =>
								tagFilter && !showAddTag && i === suggestedTags.length - 1 ? null : (
									<React.Fragment key={`${tag}-${i < (tagDividerIndex || 0) ? 'branch' : 'leaf'}`}>
										{!tagFilter && !i && !!tagDividerIndex && (
											<div className="z-10 sticky top-0 bg-bg2 px-3 font-bold text-fg2">
												Branch nodes
											</div>
										)}
										{!tagFilter && i === tagDividerIndex && (
											<div className={`z-10 sticky top-0 bg-bg2 px-3 font-bold text-fg2`}>
												Leaf nodes
											</div>
										)}
										<Link
											to={`/tags/${encodeURIComponent(tag)}`}
											className={`group flex-1 pl-3 truncate fx text-xl border-t border-bg1 border-b ${tagIndex === i ? 'bg-bg2' : 'bg-bg1'}`}
											ref={(r) => (tagSuggestionsRefs.current[i] = r)}
											onClick={(e) => {
												tagIndexSet(i);
												i === suggestedTags.length - 1 && showAddTag && addRootTag(e.ctrlKey);
												tagIndex === i ? rootTagIpt.current?.focus() : searchIpt.current?.focus();
											}}
										>
											<div className="flex-1 text-left text-xl font-medium transition text-fg1 truncate">
												{tag}
											</div>
											{i === suggestedTags.length - 1 && showAddTag ? (
												<PlusIcon className={`transition h-6 text-fg2 group-hover:text-fg1`} />
											) : (
												<ChevronRightIcon
													className={`h-6 ${tagIndex === i ? 'text-fg2 group-hover:text-fg1' : 'text-bg1 group-hover:text-fg2'}`}
												/>
											)}
										</Link>
									</React.Fragment>
								),
							)}
					</div>
				</div>
			</div>
			<div
				className="p-3 pt-0 flex-[2] border-l-2 border-mg2 min-h-[calc(100vh-3rem)] overflow-scroll"
				// TODO: horizontal drag to resize
			>
				{!suggestedTags ? null : !rootTag ? (
					<div className="xy h-full">
						<p className="text-xl">
							{tagIndex === -1
								? `"${tag}" is not a tag`
								: allTags?.size === 0
									? 'No tags'
									: `Add "${tagFilter}" with Enter`}
						</p>
					</div>
				) : (
					<>
						{!!rootParents.length && (
							<div className="mb-1 fx gap-2">
								{rootParents.map((tag, i) => (
									<Link
										key={tag}
										to={`/tags/${encodeURIComponent(tag)}`}
										className="text-lg font-semibold rounded px-2 border-2 transition hover:text-fg1 text-fg2 border-fg2"
										onKeyDown={(e) => {
											if (!i && e.key === 'Tab' && e.shiftKey) {
												tagSuggestionsRefs.current[0]?.focus();
											}
										}}
									>
										{tag}
									</Link>
								))}
							</div>
						)}
						<TagEditor
							subTaggingLineage={subTaggingLineageRef.current}
							parentRef={rootTagIpt}
							recTag={rootTag}
							onSubtag={addSubtag}
							onRename={renameTag}
							onRemove={removeTag}
							onKeyDown={(e) => {
								if (!rootParents.length && e.key === 'Tab' && e.shiftKey) {
									tagSuggestionsRefs.current[0]?.focus();
								}
							}}
						/>
					</>
				)}
			</div>
		</div>
	);
}
