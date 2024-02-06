import {
	ArrowTopRightOnSquareIcon,
	PlusCircleIcon,
	MinusIcon,
	PlusIcon,
	// ArrowDownTrayIcon,
} from '@heroicons/react/16/solid';
import { useState } from 'react';
import { formatTimestamp } from '../utils/time';
import { Link } from 'react-router-dom';

export type Note = {
	createDate: number;
	authorId: number;
	content: string;
	tags?: string[];
	parent?: number;
	children?: number[];
};

export default function NoteBlock(props: { note: Note; depth?: number }) {
	const [open, openSet] = useState(true);
	const { note, depth = 0 } = props;

	return (
		<div className={`flex rounded ${depth % 2 === 0 ? 'bg-bg2' : 'bg-bg3'}`}>
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
						<button className="h-4 w-4 xy hover:text-fg1 transition">
							<ArrowTopRightOnSquareIcon className="absolute rotate-90 h-5 w-5" />
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
				</div>
				{/* {note.children?.map((childNote, i) => {
					return <NoteBlock key={i} note={childNote} depth={depth + 1} />;
				})} */}
			</div>
		</div>
	);
}
