import { CheckCircleIcon, PlusIcon, XCircleIcon } from '@heroicons/react/16/solid';
import { useCallback, useRef, useState } from 'react';
import { tagsUse, personaUse } from './GlobalState';
import { buildUrl, pinger } from '../utils/api';

export const ThoughtWriter = ({ parentId, onLink }: { parentId?: string; onLink?: () => void }) => {
	const [tags] = tagsUse();
	const [personaId] = personaUse();
	const contentRef = useRef<null | HTMLTextAreaElement>(null);
	const [thoughtTags, thoughtTagsSet] = useState<string[]>([
		// 'test',
		// 'San Francisco',
		// 'Cities',
		// 'California',
		// 'Japan',
		// 'Network',
	]);
	const [suggestTags, suggestTagsSet] = useState(false);
	const thoughtTagRefs = useRef<(null | HTMLButtonElement)[]>([]);
	const tagSuggestionsRefs = useRef<(null | HTMLButtonElement)[]>([]);
	const tagInput = useRef<null | HTMLInputElement>(null);

	const writeThought = useCallback(() => {
		if (!contentRef.current!.value) return;

		pinger<{ createDate: number }>(buildUrl('write-thought'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				parentId,
				thought: {
					spaceId: null,
					authorId: personaId,
					content: contentRef.current!.value,
					tags: thoughtTags,
				},
			}),
		})
			.then(() => {
				// caching is premature optimization atm. Just ping local sever to update ui
				onLink && onLink();
				contentRef.current!.value = '';
				thoughtTagsSet([]);
				suggestTagsSet(false);
			})
			.catch((err) => alert(JSON.stringify(err, null, 2)));
	}, [parentId, onLink, thoughtTags]);

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

	return (
		<div className="w-full flex flex-col">
			<textarea
				autoFocus
				ref={contentRef}
				name="content"
				placeholder="New thought"
				className="rounded text-xl font-medium p-3 w-full max-w-full resize-y bg-mg1 transition brightness-75 focus:brightness-100"
				onKeyDown={(e) => {
					if (e.key === 'Enter' && e.metaKey) {
						writeThought();
					}
				}}
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
										ref={(r) => (thoughtTagRefs.current[i] = r)}
										onClick={(e) => {
											e.stopPropagation(); // this is needed to focus the next tag
											thoughtTagRefs.current[i - (e.shiftKey ? 1 : 0)]?.focus();

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
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							const tag = tagInput.current!.value.trim();
							if (tag) {
								thoughtTagsSet([...thoughtTags, tag]);
								tagInput.current!.value = '';
							}
							if (e.metaKey) {
								writeThought();
							}
						} else if (e.key === 'Escape') {
							suggestTagsSet(!suggestTags);
						}
					}}
				/>
				{suggestTags && (
					<div className="z-10 flex flex-col overflow-scroll rounded-b mt-0.5 bg-mg1 absolute w-full max-h-56 shadow">
						{tags?.length ? (
							tags.map((tag, i) => {
								const tagIndex = thoughtTags.indexOf(tag.label);
								const inThoughtTags = tagIndex !== -1;
								return (
									<button
										key={i}
										className="fx px-3 text-xl"
										ref={(r) => (tagSuggestionsRefs.current[i] = r)}
										onBlur={onAddingTagBlur}
										onClick={() => {
											if (inThoughtTags) {
												const newThoughtTags = [...thoughtTags];
												newThoughtTags.splice(tagIndex, 1);
												thoughtTagsSet(newThoughtTags);
											} else {
												thoughtTagsSet([...thoughtTags, tag.label]);
											}
										}}
										onKeyDown={(e) => {
											e.key === 'Escape' && suggestTagsSet(false);
											e.key === 'Enter' && e.metaKey && writeThought();
										}}
									>
										{tag.label} {inThoughtTags && <CheckCircleIcon className="ml-1 h-3.5 w-3.5" />}
									</button>
								);
							})
						) : (
							<div className="px-3 py-1 text-xl">No tags</div>
						)}
					</div>
				)}
			</div>
			<button
				className="mt-1 px-2 self-end rounded text-lg font-semibold transition bg-mg1 hover:bg-mg2"
				onClick={writeThought}
			>
				<PlusIcon className="h-7 w-7" />
			</button>
		</div>
	);
};
