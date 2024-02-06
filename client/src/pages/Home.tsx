import { CheckCircleIcon, PlusIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/16/solid';
import { useCallback, useEffect, useRef, useState } from 'react';
import NoteBlock, { Note } from '../components/NoteBlock';
import { buildUrl, pinger, usePinger } from '../utils/api';
import { Tag } from '../utils/tags';

const notesPerPage = 8;

const PageBlock = ({ page }: { page: Note[] }) => {
	return page.map((note, i) => {
		// console.log('note:', note);
		return <NoteBlock key={i} note={note} />;
	});
};

export default function Home() {
	const [startDate] = useState(Date.now());
	// TODO: const userId = useUserId();
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
	const [additionalNotes, additionalNotesSet] = useState<Note[]>([]);
	const [pages, pagesSet] = useState<Note[][]>([]);
	const [endReached, endReachedSet] = useState(false);
	const { data: tags } = usePinger<Tag[]>(buildUrl('get-tags'));

	const writeNote = useCallback(() => {
		if (!contentRef.current!.value) return;
		const userId = 123;
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
			body: JSON.stringify(newNote),
		})
			.then(({ createDate }) => {
				additionalNotesSet([{ createDate, ...newNote } as Note, ...additionalNotes]);
				contentRef.current!.value = '';
				noteTagsSet([]);
			})
			.catch((err) => window.alert(JSON.stringify(err, null, 2)));
	}, ['userId', noteTags, pages, 'parent']);

	const loadNextPage = useCallback(() => {
		const lastPage = pages[pages.length - 1];
		const pageAfter = pages.length ? lastPage[lastPage.length - 1].createDate : startDate;

		pinger<Note[]>(buildUrl('get-local-notes', { pageAfter, oldToNew: false }))
			.then((newPage) => {
				// console.log('newPage', newPage);
				pagesSet([...pages, newPage]);
				endReachedSet(newPage.length < notesPerPage);
			})
			.catch((err) => {
				console.log('err', err);
			});
	}, [pages]);

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

	useEffect(() => {
		loadNextPage();
	}, []);

	// QUESTION: Why does get-local-notes need cors but not whoami?
	// useEffect(() => {
	// 	(async () => {
	// 		const thing = await (await fetch('http://localhost:3000/whoami')).json();
	// 		console.log('thing:', thing);
	// 	})();
	// }, []);

	return (
		<div className="p-4 flex-1">
			<div className="w-full max-w-2xl ">
				<textarea
					ref={contentRef}
					name="content"
					placeholder="New note"
					className="rounded text-xl font-medium p-3 bg-mg1 w-full max-w-full resize-y"
					onKeyDown={(e) => {
						if (e.key === 'Enter' && e.metaKey) {
							writeNote();
						}
					}}
				/>
				{!!noteTags.length && (
					<div
						className="mt-0.5 fx flex-wrap px-3 py-1 gap-1 rounded-t bg-bg2 text-lg"
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

				<div className="mt-0.5 relative">
					<input
						name="noteTags"
						autoComplete="off"
						className={`px-3 py-1 text-xl bg-mg1 w-full overflow-hidden ${noteTags.length ? '' : 'rounded-t'} ${suggestTags ? '' : 'rounded-b'}`}
						placeholder="Add noteTags with Enter"
						ref={tagInput}
						onFocus={() => suggestTagsSet(true)}
						onBlur={onAddingTagBlur}
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
								suggestTagsSet(false);
							}
						}}
					/>
					{suggestTags && (
						<div className="z-10 flex flex-col rounded-b mt-0.5 bg-mg1 absolute w-full max-h-56 h-screen">
							{tags?.map((tag, i) => {
								const tagIndex = noteTags.indexOf(tag.tag);
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
												noteTagsSet([...noteTags, tag.tag]);
											}
										}}
										onKeyDown={(e) => {}}
									>
										{tag.tag} {inNoteTags && <CheckCircleIcon className="ml-1 h-3.5 w-3.5" />}
									</button>
								);
							})}
						</div>
					)}
				</div>

				<div className="mt-2 justify-end fx gap-2">
					<button
						className="px-2 text-lg font-semibold group"
						onClick={() => {
							if (
								(contentRef.current!.value || noteTags.length) &&
								window.confirm('Are you sure you want to delete this draft?')
							) {
								contentRef.current!.value = '';
								noteTagsSet([]);
							}
						}}
					>
						<XMarkIcon className="h-7 w-7 text-fg2 transition group-hover:text-fg1" />
					</button>
					<button
						className="px-2 rounded text-lg font-semibold transition bg-mg1 hover:bg-mg2"
						onClick={writeNote}
					>
						<PlusIcon className="h-7 w-7" />
					</button>
				</div>
			</div>
			<div className="mt-3 space-y-1.5">
				<PageBlock page={additionalNotes} />
				{pages.map((page, i) => {
					return <PageBlock key={i} page={page} />;
				})}
				{!endReached && (
					<button className="rounded self-center px-3 bg-mg1 hover:bg-mg2" onClick={loadNextPage}>
						Load more
					</button>
				)}
			</div>
		</div>
	);
}
