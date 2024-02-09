import {
	ArrowTopRightOnSquareIcon,
	PlusCircleIcon,
	MinusIcon,
	PlusIcon,
	XMarkIcon,
	// ArrowDownTrayIcon,
} from '@heroicons/react/16/solid';
import { useEffect, useMemo, useState } from 'react';
import { formatTimestamp } from '../utils/time';
import { Link } from 'react-router-dom';
import { NoteWriter } from './NoteWriter';
import { buildUrl, pinger } from '../utils/api';

export type Note = {
	createDate: number;
	authorId: number;
	content: string;
	tags?: string[];
	parentId?: string;
	childrenIds?: string[];
};

export default function NoteBlock(props: { noteId?: string; note?: Note; depth?: number }) {
	const [open, openSet] = useState(true);
	const [linking, linkingSet] = useState(false);
	const [note, noteSet] = useState<Note>(props.note!);
	const { depth = 0 } = props;

	useEffect(() => {
		if (!props.note) {
			const [createDate, authorId] = props.noteId!.split('.');
			pinger<Note>(buildUrl('get-note'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ createDate, authorId }),
			})
				.then((data) => {
					noteSet(data);
				})
				.catch((err) => alert('Error: ' + err));
		}
	}, [props]);

	const noteId = useMemo(() => {
		if (note) {
			return note.createDate + '.' + note.authorId;
		}
	}, [note]);

	return (
		<div className={`flex rounded ${depth % 2 === 0 ? 'bg-bg2' : 'bg-bg1'}`}>
			{note ? (
				<>
					<button
						className="w-5 fy transition rounded-l text-fg2 hover:text-fg1 hover:bg-mg2"
						onClick={() => openSet(!open)}
					>
						<div className="justify-self-start mt-1">
							{open ? <MinusIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
						</div>
					</button>
					<div className="p-1 flex-1">
						<p className="text-sm text-fg2 font-bold">{formatTimestamp(note.createDate)}</p>
						<div className={`${open ? '' : 'hidden'}`}>
							<pre className="">{note.content}</pre>
							<div className="mt-1 fx gap-2 text-fg2">
								<button
									className="h-4 w-4 xy hover:text-fg1 transition"
									onClick={() => linkingSet(!linking)}
								>
									{linking ? (
										<XMarkIcon className="absolute h-6 w-6" />
									) : (
										<ArrowTopRightOnSquareIcon className="absolute rotate-90 h-5 w-5" />
									)}
								</button>
								<button className="h-4 w-4 xy hover:text-fg1 transition">
									<PlusCircleIcon className="absolute h-4 w-4" />
								</button>
								{/* <button className="h-4 w-4 xy hover:text-fg1 transition" onClick={() => {}}>
							<ArrowDownTrayIcon className="absolute h-5 w-5" />
						</button> */}
								{/* <button className="">Reference</button>
						<button className="">Bookmark</button> */}
								{!!note.tags?.length &&
									note.tags.map((tag) => {
										const queryString = new URLSearchParams({
											search: `[${tag}]`, // TODO: tag page
										}).toString();
										return (
											<Link
												key={tag}
												to={`/results?${queryString}`}
												className="text-fg2 hover:text-fg1 transition  font-semibold leading-5"
											>
												{tag}
											</Link>
										);
									})}
							</div>
							{linking && (
								<div className={`${depth % 2 === 0 ? 'bg-bg1' : 'bg-bg2'} p-2 rounded mt-1`}>
									<NoteWriter parentId={noteId} onLink={() => linkingSet(false)} />
								</div>
							)}
						</div>
						{note.childrenIds && (
							<div className="mt-1">
								{note.childrenIds.map((childrenId, i) => (
									<NoteBlock key={i} noteId={childrenId} depth={depth + 1} />
								))}
							</div>
						)}
					</div>
				</>
			) : (
				<div className="">loading</div>
			)}
		</div>
	);
}
