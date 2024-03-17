import { ChevronRightIcon, PlusIcon } from '@heroicons/react/16/solid';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTagTree } from '../components/GlobalState';
import { buildUrl, ping, post } from '../utils/api';
import { TagTree, getNodes, getNodesArr, getParentsMap, makeRootTag } from '../utils/tags';
import TagEditor from '../components/TagEditor';
import { debounce } from '../utils/performance';
import { useKeyPress } from '../utils/keyboard';
import { matchSorter } from 'match-sorter';

export default function Tags() {
	const navigate = useNavigate();
	const { tag } = useParams();
	const [tagTree, tagTreeSet] = useTagTree();
	// let [tagTree, tagTreeSet] = useTagTree();
	// tagTree = { parents: {}, loners: [] };
	const [tagFilter, tagFilterSet] = useState('');
	const [tagIndex, tagIndexSet] = useState<null | number>(tag ? null : 0);
	const focusedElementAfterSearch = useRef<null | HTMLInputElement | HTMLLinkElement>(null);
	const searchIpt = useRef<null | HTMLInputElement>(null);
	const rootTagIpt = useRef<null | HTMLInputElement>(null);
	const tagSuggestionsRefs = useRef<(null | HTMLAnchorElement)[]>([]);
	const [subTaggingLineage, subTaggingLineageSet] = useState<string[]>([]);
	const lastTag = useRef('');

	const parentsMap = useMemo(() => tagTree && getParentsMap(tagTree), [JSON.stringify(tagTree)]);
	const nodes = useMemo(() => tagTree && getNodes(tagTree), [tagTree]);
	const nodesArr = useMemo(() => nodes && getNodesArr(nodes), [nodes]);
	const nodesSet = useMemo(() => new Set(nodesArr), [nodesArr]);
	const tagToAdd = useMemo(
		() => (nodesSet.has(tagFilter.trim()) ? '' : tagFilter.trim()),
		[nodesSet, tagFilter],
	);
	const suggestedTags = useMemo(
		() =>
			nodesArr && (tagFilter ? matchSorter(nodesArr, tagFilter).concat(tagToAdd || []) : nodesArr),
		[nodesArr, tagFilter, tagToAdd],
	);
	const rootTag = useMemo(() => {
		return tagTree && suggestedTags && tagIndex !== null
			? makeRootTag(tagTree, suggestedTags[tagIndex])
			: null;
	}, [tagTree, suggestedTags, tagIndex]);
	const rootParents = useMemo(
		() => (rootTag && parentsMap?.[rootTag.label]) || null,
		[parentsMap, rootTag],
	);

	const replaceTag = useCallback((tag?: string) => {
		navigate(!tag ? '/tags' : `/tags/${encodeURIComponent(tag)}`, { replace: true });
	}, []);
	const debouncedReplaceTag = useCallback(
		debounce((tag?: string) => replaceTag(tag), 100),
		[],
	);

	const refreshTagTree = useCallback(
		(rootTagLabel: string, ignoreTagFilter = false) => {
			ping<TagTree>(buildUrl('get-tag-tree'))
				.then((data) => {
					tagTreeSet(data);
					const newNodesArr = getNodesArr(getNodes(data));
					const newSuggestedTags =
						ignoreTagFilter || !tagFilter ? newNodesArr : matchSorter(newNodesArr, tagFilter);
					const i = newSuggestedTags.indexOf(rootTagLabel);
					tagIndexSet(i === -1 ? 0 : i);
				})
				.catch((err) => alert(JSON.stringify(err)));
		},
		[tagFilter, tagToAdd],
	);

	const addRootTag = useCallback(
		(newTag: string, ctrlKey: boolean, altKey: boolean) => {
			console.log('newTag:', newTag);
			console.log('ctrlKey:', ctrlKey);
			console.log('altKey:', altKey);
			altKey && tagFilterSet('');
			subTaggingLineageSet(ctrlKey ? [newTag] : []);
			ping(buildUrl('add-tag'), post({ tag: newTag }))
				.then(() => refreshTagTree(newTag, altKey))
				.catch((err) => alert(JSON.stringify(err)));
		},
		[refreshTagTree],
	);

	const addSubtag = useCallback(
		(tag: string, parentTag: string, newSubTaggingLineage: string[]) => {
			subTaggingLineageSet(newSubTaggingLineage);
			!newSubTaggingLineage && searchIpt.current?.focus();
			return ping(buildUrl('add-tag'), post({ tag, parentTag }))
				.then(() => refreshTagTree(rootTag!.label))
				.catch((err) => alert(JSON.stringify(err)));
		},
		[rootTag?.label, refreshTagTree],
	);

	const renameTag = useCallback(
		async (oldTag: string, newTag: string, newSubTaggingLineage: string[]) => {
			subTaggingLineageSet(newSubTaggingLineage);
			return (
				ping(buildUrl('rename-tag'), post({ oldTag, newTag }))
					.then(() => refreshTagTree(rootTag!.label === oldTag ? newTag : rootTag!.label))
					// .then(() => searchIpt.current?.focus())
					.catch((err) => alert(JSON.stringify(err)))
			);
		},
		[rootTag?.label, refreshTagTree],
	);

	const removeTag = useCallback(
		(tag: string, parentTag?: string) =>
			ping(buildUrl('remove-tag'), post({ tag, parentTag }))
				.then(() => refreshTagTree(rootTag!.label))
				.then(() => searchIpt.current?.focus())
				.catch((err) => alert(JSON.stringify(err))),
		[rootTag?.label, refreshTagTree],
	);

	const onArrowUpOrDown = useCallback(
		(e: KeyboardEvent) => {
			if (
				(document.activeElement!.tagName === 'INPUT' &&
					document.activeElement !== searchIpt.current) ||
				!suggestedTags
			)
				return;
			e.preventDefault();
			const index =
				tagIndex === null
					? 0
					: Math.min(
							Math.max(tagIndex + (e.key === 'ArrowUp' ? -1 : 1), 0),
							suggestedTags.length - 1,
						);
			tagSuggestionsRefs.current[index]?.focus();
			searchIpt.current?.focus();
			tagIndexSet(index);
			const nextTag = suggestedTags[index];
			if (e.repeat) {
				if (lastTag.current === nextTag) return;
				debouncedReplaceTag(nextTag);
				lastTag.current = nextTag;
			} else {
				replaceTag(suggestedTags[index]);
			}
		},
		[tagIndex, suggestedTags],
	);
	useKeyPress({ key: 'ArrowDown', allowRepeats: true }, onArrowUpOrDown, [onArrowUpOrDown]);
	useKeyPress({ key: 'ArrowUp', allowRepeats: true }, onArrowUpOrDown, [onArrowUpOrDown]);

	useEffect(() => {
		const newTag = rootTag?.label || (tagIndex && suggestedTags?.[tagIndex]);
		newTag && debouncedReplaceTag(newTag);
	}, [rootTag?.label, tagIndex, suggestedTags]);
	useEffect(() => {
		if (tagIndex === null && suggestedTags && tag) {
			tagIndexSet(suggestedTags.indexOf(tag));
		}
	}, [tagIndex, suggestedTags, tag]);

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
							tagIndex !== 0 && tagIndexSet(0);
							tagFilterSet(e.target.value);
						}}
						onKeyDown={(e) => {
							e.key === 'Escape' && searchIpt.current?.blur();
							if (e.key === 'Tab' && !e.shiftKey) {
								e.preventDefault();
								focusedElementAfterSearch.current!.focus();
							}
							if (e.key === 'Enter' && suggestedTags && tagIndex !== null) {
								if (suggestedTags[tagIndex] === tagToAdd) {
									addRootTag(tagToAdd, e.ctrlKey, e.altKey);
								} else {
									e.preventDefault();
									rootTagIpt.current?.focus();
								}
							}
						}}
					/>
					<div className="flex-1 pb-1.5 overflow-scroll">
						{suggestedTags &&
							suggestedTags.map((tag, i) => (
								<React.Fragment key={tag}>
									{!tagFilter && !i && !!nodes?.loners.length && (
										<div
											className={`z-10 fx justify-between sticky top-0 bg-bg2 px-3 font-bold text-fg2`}
										>
											Lone tags
											<div className="h-2 w-2 rounded-full border bg-red-500 border-red-600" />
										</div>
									)}
									{!tagFilter && nodes && i === nodes.loners.length && (
										<div className="z-10 fx justify-between sticky top-0 bg-bg2 px-3 font-bold text-fg2">
											Parent tags
											<div className="h-2 w-2 rounded-full border bg-green-500 border-green-600" />
										</div>
									)}
									{!tagFilter && nodes && i === nodes.loners.length + nodes.parents.length && (
										<div
											className={`z-10 fx justify-between sticky top-0 bg-bg2 px-3 font-bold text-fg2`}
										>
											Child tags
											<div className="h-2 w-2 rounded-full border bg-blue-500 border-blue-600" />
										</div>
									)}
									<Link
										to={`/tags/${encodeURIComponent(tag)}`}
										className={`group flex-1 pl-3 truncate fx text-xl border-t border-bg1 border-b ${tagIndex === i ? 'bg-bg2' : 'bg-bg1'}`}
										ref={(r) => (tagSuggestionsRefs.current[i] = r)}
										onClick={(e) => {
											tagIndexSet(i);
											i === suggestedTags.length - 1 &&
												tagToAdd &&
												addRootTag(tagToAdd, e.ctrlKey, e.altKey);
											tagIndex === i ? rootTagIpt.current?.focus() : searchIpt.current?.focus();
										}}
									>
										<div className="flex-1 text-left text-xl font-medium transition text-fg1 truncate">
											{tag}
										</div>
										{i === suggestedTags.length - 1 && tagToAdd ? (
											<PlusIcon className={`transition h-6 text-fg2 group-hover:text-fg1`} />
										) : (
											<ChevronRightIcon
												className={`h-6 ${tagIndex === i ? 'text-fg2 group-hover:text-fg1' : 'hidden group-hover:block text-fg2'}`}
											/>
										)}
									</Link>
								</React.Fragment>
							))}
					</div>
				</div>
			</div>
			<div
				className="p-3 pt-0 flex-[2] border-l-2 border-mg2 min-h-[calc(100vh-3rem)] overflow-scroll"
				// TODO: horizontal drag to resize
			>
				{!rootTag ? (
					<div className="xy h-full">
						<p className="text-xl">
							{tagFilter && tagToAdd
								? `Add "${tagToAdd}" with Enter`
								: !!nodesArr?.length && tagFilter.length > 9 && '😳'}
							{nodesArr && !nodesArr.length && 'No tags'}
							{tagIndex === -1 && `"${tag}" is not a tag`}
						</p>
					</div>
				) : (
					<>
						{rootParents && (
							<div className="mb-1 fx gap-2">
								{rootParents.map((tag, i) => (
									<Link
										key={tag}
										ref={(r) => {
											// @ts-ignore
											!i && (focusedElementAfterSearch.current = r);
										}}
										to={`/tags/${encodeURIComponent(tag)}`}
										className="text-lg font-semibold rounded px-2 border-2 transition hover:text-fg1 text-fg2 border-fg2"
										onKeyDown={(e) => {
											if (!i && e.key === 'Tab' && e.shiftKey) {
												e.preventDefault();
												searchIpt.current?.focus();
											}
										}}
										onClick={(e) => {
											if (e.metaKey || e.shiftKey || !suggestedTags || !nodesArr) return;
											let i = suggestedTags.indexOf(tag);
											if (i === -1) {
												tagFilterSet('');
												i = nodesArr.indexOf(tag);
												setTimeout(() => tagSuggestionsRefs.current[i]?.focus(), 0);
											}
											tagIndexSet(i);
										}}
									>
										{tag}
									</Link>
								))}
							</div>
						)}
						<TagEditor
							subTaggingLineage={subTaggingLineage}
							_ref={(r) => {
								!rootParents && (focusedElementAfterSearch.current = r);
								rootTagIpt.current = r;
							}}
							recTag={rootTag}
							onSubtag={addSubtag}
							onRename={renameTag}
							onRemove={removeTag}
							onKeyDown={(e) => {
								if (!rootParents?.length && e.key === 'Tab' && e.shiftKey) {
									e.preventDefault();
									searchIpt.current?.focus();
								}
							}}
						/>
					</>
				)}
			</div>
		</div>
	);
}
