import { XMarkIcon } from '@heroicons/react/16/solid';
import { useCallback, useEffect, useRef, useState } from 'react';
import NoteBlock, { Note } from './NoteBlock';
import { buildUrl } from '../utils/api';
import { useSearchParams } from 'react-router-dom';

const notesPerPage = 8;

const fetcher = <T,>(...args: Parameters<typeof fetch>): Promise<T> =>
	fetch(...args).then((res) => res.json());

const PageBlock = ({ page }: { page: Note[] }) => {
	return page.map((note) => {
		// console.log('note:', note);
		return <NoteBlock key={note.createDate} {...note} />;
	});
};

export default function Home() {
	let [searchParams, searchParamsSet] = useSearchParams();
	const searchedKeywords = searchParams.get('search') || '';
	// TODO: const userId = useUserId();
	const contentRef = useRef<null | HTMLTextAreaElement>(null);
	const [tags, tagsSet] = useState<string[]>([]);
	const tagInput = useRef<null | HTMLInputElement>(null);
	const [startDate] = useState(Date.now());

	const [pages, pagesSet] = useState<Note[][]>([]);
	const [endReached, endReachedSet] = useState(false);

	const writeNote = useCallback(() => {
		const userId = 123;
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

		fetcher<Note[]>(buildUrl('search-local-fs', { pageAfter, searchedKeywords, oldToNew: false }))
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
				<div
					className="mt-0.5 fx flex-wrap p-3 gap-1.5 rounded-t bg-mg1 text-xl"
					onClick={() => tagInput.current!.focus()}
				>
					{tags.length ? (
						tags.map((name, i) => {
							return (
								<div
									key={i}
									className="tag bg-mg2 text-fg1 flex rounded-full overflow-hidden hover:bg-mg3 pl-0.5"
								>
									<div className="tag-label pl-2.5 pr-1">{name}</div>
									<button
										className="xy group h-8 w-8 rounded-full -outline-offset-4"
										onClick={() => {
											const newCats = [...tags];
											newCats.splice(i, 1);
											tagsSet(newCats);
										}}
									>
										<div className="w-5 h-5 xy rounded-full border-[1px] border-fg2 group-hover:border-fg1">
											<XMarkIcon className="w-4 h-4 text-fg2 group-hover:text-fg1" />
										</div>
									</button>
								</div>
							);
						})
					) : (
						<p className="text-xl text-fg2">Tags</p>
					)}
				</div>
				<div className="h-0.5 bg-bg1"></div>
				<input
					name="tags"
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
						className="px-3 py-0.5 rounded font-medium transition bg-mg1 hover:bg-mg2"
						onClick={writeNote}
					>
						Save
					</button>
					{/* <input type="checkbox" /> */}
				</div>
			</div>
			<div className="mt-3 space-y-3">
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
