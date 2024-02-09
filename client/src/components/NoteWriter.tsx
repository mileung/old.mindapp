import { CheckCircleIcon, PlusIcon, XCircleIcon } from '@heroicons/react/16/solid';
import { useCallback, useRef, useState } from 'react';
import { buildUrl, pinger, usePinger } from '../utils/api';
import { Tag } from '../utils/tags';
import { Note } from './NoteBlock';
import { useNotes } from './GlobalState';

export const NoteWriter = ({ parentId, onLink }: { parentId?: string; onLink?: () => void }) => {
	const [notes, notesSet] = useNotes();
	const contentRef = useRef<null | HTMLTextAreaElement>(null);
	const [noteTags, noteTagsSet] = useState<string[]>([
		// 'test',
		// 'San Francisco',
		// 'Cities',
		// 'California',
		// 'Japan',
		// 'Network',
	]);
	const [suggestTags, suggestTagsSet] = useState(false);
	const noteTagRefs = useRef<(null | HTMLButtonElement)[]>([]);
	const tagSuggestionsRefs = useRef<(null | HTMLButtonElement)[]>([]);
	const tagInput = useRef<null | HTMLInputElement>(null);
	const { data: tags } = usePinger<Tag[]>(buildUrl('get-tags'));

	const writeNote = useCallback(() => {
		if (!contentRef.current!.value) return;
		const userId = 123;
		const [parentCreateDate, parentAuthorId] = (parentId || '').split('.');
		console.log('parentId:', parentId);
		const newNote: Partial<Note> = {
			authorId: userId,
			content: contentRef.current!.value,
			tags: noteTags,
		};

		pinger<{ createDate: number }>(buildUrl('write-note'), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				parentCreateDate: +parentCreateDate,
				parentAuthorId: +parentAuthorId,
				note: newNote,
			}),
		})
			.then(({ createDate }) => {
				notesSet([{ createDate, ...newNote } as Note, ...notes]);
				onLink && onLink();
				contentRef.current!.value = '';
				noteTagsSet([]);
				suggestTagsSet(false);
			})
			.catch((err) => alert(JSON.stringify(err, null, 2)));
	}, [parentId, onLink, noteTags]);

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
		<div className="w-full max-w-2xl flex flex-col">
			<textarea
				autoFocus
				ref={contentRef}
				name="content"
				placeholder="New note"
				className="rounded text-xl font-medium p-3 w-full max-w-full resize-y bg-mg1 transition brightness-75 focus:brightness-100"
				onKeyDown={(e) => {
					if (e.key === 'Enter' && e.metaKey) {
						writeNote();
					}
				}}
			/>
			<div className="mt-1 relative">
				{!!noteTags.length && (
					<div
						className="mb-0.5 fx flex-wrap px-3 py-1 gap-1 rounded-t bg-bg2 text-lg"
						onClick={() => tagInput.current!.focus()}
					>
						{noteTags.map((name, i) => {
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
										ref={(r) => (noteTagRefs.current[i] = r)}
										onClick={(e) => {
											e.stopPropagation(); // this is needed to focus the next tag
											noteTagRefs.current[i - (e.shiftKey ? 1 : 0)]?.focus();

											const newCats = [...noteTags];
											newCats.splice(i, 1);
											noteTagsSet(newCats);
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
					className={`px-3 py-1 text-xl bg-mg1 w-full overflow-hidden transition brightness-75 focus:brightness-100 ${noteTags.length ? '' : 'rounded-t'} ${suggestTags ? '' : 'rounded-b'}`}
					placeholder="Add tags with Enter"
					ref={tagInput}
					onFocus={() => suggestTagsSet(true)}
					onBlur={onAddingTagBlur}
					onClick={() => suggestTagsSet(true)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							const tag = tagInput.current!.value.trim();
							if (tag) {
								noteTagsSet([...noteTags, tag]);
								tagInput.current!.value = '';
							}
							if (e.metaKey) {
								writeNote();
							}
						} else if (e.key === 'Escape') {
							suggestTagsSet(!suggestTags);
						}
					}}
				/>
				{suggestTags && (
					<div className="z-10 flex flex-col overflow-scroll rounded-b mt-0.5 bg-mg1 absolute w-full max-h-56 h-screen shadow">
						{tags?.map((tag, i) => {
							const tagIndex = noteTags.indexOf(tag.label);
							const inNoteTags = tagIndex !== -1;
							return (
								<button
									key={i}
									className="fx px-3 text-xl"
									ref={(r) => (tagSuggestionsRefs.current[i] = r)}
									onBlur={onAddingTagBlur}
									onClick={() => {
										if (inNoteTags) {
											const newNoteTags = [...noteTags];
											newNoteTags.splice(tagIndex, 1);
											noteTagsSet(newNoteTags);
										} else {
											noteTagsSet([...noteTags, tag.label]);
										}
									}}
									onKeyDown={(e) => {
										e.key === 'Escape' && suggestTagsSet(false);
										e.key === 'Enter' && e.metaKey && writeNote();
									}}
								>
									{tag.label} {inNoteTags && <CheckCircleIcon className="ml-1 h-3.5 w-3.5" />}
								</button>
							);
						})}
					</div>
				)}
			</div>
			<button
				className="mt-1 px-2 self-start rounded text-lg font-semibold transition bg-mg1 hover:bg-mg2"
				onClick={writeNote}
			>
				<PlusIcon className="h-7 w-7" />
			</button>
		</div>
	);
};
