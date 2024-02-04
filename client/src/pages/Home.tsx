import { XCircleIcon, XMarkIcon } from '@heroicons/react/16/solid';
import { useCallback, useEffect, useRef, useState } from 'react';
import NoteBlock, { Note } from '../components/NoteBlock';
import { buildUrl, fetcher } from '../utils/api';

const notesPerPage = 8;

const PageBlock = ({ page }: { page: Note[] }) => {
	return page.map((note, i) => {
		// console.log('note:', note);
		return <NoteBlock key={i} {...note} />;
	});
};

let lastTagInput = '';
export default function Home() {
	// TODO: const userId = useUserId();
	const contentRef = useRef<null | HTMLTextAreaElement>(null);
	const [tags, tagsSet] = useState<string[]>([
		'test',
		'San Francisco',
		'Cities',
		'California',
		'Japan',
		'Network',
	]);
	const tagRefs = useRef<(null | HTMLButtonElement)[]>([]);
	const tagInput = useRef<null | HTMLInputElement>(null);
	const [startDate] = useState(Date.now());
	const [additionalNotes, additionalNotesSet] = useState<Note[]>([]);
	const [pages, pagesSet] = useState<Note[][]>([]);
	const [endReached, endReachedSet] = useState(false);

	const writeNote = useCallback(() => {
		if (!contentRef.current!.value) return;
		const userId = 123;
		const newNote: Partial<Note> = {
			authorId: userId,
			content: contentRef.current!.value,
			tags,
		};
		fetcher<{ createDate: number }>(buildUrl('write-note'), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(newNote),
		})
			.then(({ createDate }) => {
				additionalNotesSet([{ createDate, ...newNote } as Note, ...additionalNotes]);
				contentRef.current!.value = '';
				tagsSet([]);
			})
			.catch((err) => window.alert(JSON.stringify(err, null, 2)));
	}, ['userId', tags, pages, 'parent']);

	const loadNextPage = useCallback(() => {
		const lastPage = pages[pages.length - 1];
		const pageAfter = pages.length ? lastPage[lastPage.length - 1].createDate : startDate;

		fetcher<Note[]>(buildUrl('get-local-notes', { pageAfter, oldToNew: false }))
			.then((newPage) => {
				// console.log('newPage', newPage);
				pagesSet([...pages, newPage]);
				endReachedSet(newPage.length < notesPerPage);
			})
			.catch((err) => {
				console.log('err', err);
			});
	}, [pages]);

	useEffect(loadNextPage, []);

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
				{!!tags.length && (
					<div
						className="mt-0.5 fx flex-wrap px-3 py-1 gap-1 rounded-t bg-bg2 text-lg"
						onClick={() => tagInput.current!.focus()}
					>
						{tags.map((name, i) => {
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
										ref={(r) => (tagRefs.current[i] = r)}
										onClick={(e) => {
											e.stopPropagation(); // this is needed to focus the next tag
											tagRefs.current[i - (e.shiftKey ? 1 : 0)]?.focus();

											const newCats = [...tags];
											newCats.splice(i, 1);
											tagsSet(newCats);
										}}
									>
										<XCircleIcon className="w-4 h-4 text-fg2 group-hover:text-fg1 transition" />
									</button>
								</div>
							);
						})}
					</div>
				)}
				<div className="h-0.5 bg-bg1"></div>
				<input
					name="tags"
					autoComplete="off"
					className="px-3 py-1 text-xl bg-mg1 w-full rounded-b overflow-hidden"
					placeholder="Add tag with Enter"
					ref={tagInput}
					onFocus={() => (tagInput.current!.value = lastTagInput)}
					onBlur={() => {
						lastTagInput = tagInput.current!.value;
						tagInput.current!.value = '';
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							const tag = tagInput.current!.value.trim();
							if (tag) {
								tagsSet([...tags, tag]);
								tagInput.current!.value = '';
							}
							if (e.metaKey) {
								writeNote();
							}
						}
					}}
				/>
				<div className="mt-2 fx gap-2">
					<button
						className="px-2 rounded text-lg font-semibold transition bg-mg1 hover:bg-mg2"
						onClick={writeNote}
					>
						Save
					</button>
					{/* <input type="checkbox" /> */}
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
