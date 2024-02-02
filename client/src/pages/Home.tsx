import { XMarkIcon } from '@heroicons/react/16/solid';
import { useCallback, useEffect, useRef, useState } from 'react';
import NoteBlock, { Note } from '../components/NoteBlock';
import { buildUrl, fetcher } from '../utils/api';
import { useSearchParams } from 'react-router-dom';

const notesPerPage = 8;

const PageBlock = ({ page }: { page: Note[] }) => {
	return page.map((note) => {
		return <NoteBlock key={note.createDate} {...note} />;
	});
};

export default function Home() {
	// TODO: const userId = useUserId();
	const contentRef = useRef<null | HTMLTextAreaElement>(null);
	const [tags, tagsSet] = useState<string[]>([]);
	const tagInput = useRef<null | HTMLInputElement>(null);
	const [startDate] = useState(Date.now());

	const [pages, pagesSet] = useState<Note[][]>([]);
	const [endReached, endReachedSet] = useState(false);

	const writeNote = useCallback(() => {
		const userId = 123;
		if (!contentRef.current!.value) return;
		fetch(buildUrl('write-note'), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				author: userId,
				content: contentRef.current!.value,
				tags,
			}),
		})
			.then(async (res) => {
				const data = await res.text();
				console.log('data', data);
				// notesSet([content, ...notes]);
				contentRef.current!.value = '';
				tagsSet([]);
			})
			.catch((err) => {
				console.log('err', err);
			})
			.finally(() => {
				// console.log('fin');
			});
	}, ['userId', tags, 'parent']);

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
					placeholder="New content"
					className="rounded text-xl p-3 bg-mg1 w-full max-w-full resize-y"
					onKeyDown={(e) => {
						if (e.key === 'Enter' && e.metaKey) {
							writeNote();
						}
					}}
				/>
				{!!tags.length && (
					<div
						className="mt-0.5 fx flex-wrap px-3 py-3 gap-1.5 rounded-t bg-bg2 text-xl"
						onClick={() => tagInput.current!.focus()}
					>
						{tags.map((name, i) => {
							return (
								<div key={i} className="bg-mg1 text-fg1 flex rounded-full overflow-hidden pl-0.5">
									<div className="pl-2.5 pr-1">{name}</div>
									<button
										className="xy group h-8 w-8 rounded-full -outline-offset-4"
										onClick={() => {
											const newCats = [...tags];
											newCats.splice(i, 1);
											tagsSet(newCats);
										}}
									>
										<div className="w-5 h-5 xy rounded-full border-[1px] border-fg2 group-hover:border-fg1 transition">
											<XMarkIcon className="w-4 h-4 text-fg2 group-hover:text-fg1 transition" />
										</div>
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
					placeholder="Separate tags with Enter"
					ref={tagInput}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							const tag = tagInput.current?.value.trim();
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
						className="px-3 py-1 rounded text-lg font-semibold transition bg-mg1 hover:bg-mg2"
						onClick={writeNote}
					>
						Save
					</button>
					{/* <input type="checkbox" /> */}
				</div>
			</div>
			<div className="mt-3 space-y-1.5">
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
