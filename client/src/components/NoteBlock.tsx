import {
	ArrowTopRightOnSquareIcon,
	PlusCircleIcon,
	MinusIcon,
	PlusIcon,
	// ArrowDownTrayIcon,
} from '@heroicons/react/16/solid';
import { useState } from 'react';
import { formatTimestamp } from '../utils/time';

export type Note = {
	createDate: number;
	authorId: number;
	content: string;
	tags?: string[];
	parent?: number;
	children?: number[];
};

export default function NoteBlock(note: Note) {
	const [open, openSet] = useState(true);

	return (
		<div className="flex bg-bg2 rounded">
			<button
				className="w-5 fy transition rounded-l text-fg2 hover:text-fg1 hover:bg-mg2"
				onClick={() => openSet(!open)}
			>
				<div className="justify-self-start mt-1">
					{open ? <MinusIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
				</div>
			</button>
			<div className="p-1">
				<p className="text-sm text-fg2 font-bold">{formatTimestamp(note.createDate)}</p>
				<div className={`${open ? '' : 'hidden'}`}>
					<pre className="">{note.content}</pre>
					<div className="fx gap-2 text-fg2 text-xs font-bold">
						{/* <button className="h-4 w-4 xy">
							<ChevronUpIcon className="absolute h-7 w-7" />
						</button>
						<button className="h-4 w-4 xy">
							<ChevronDownIcon className="absolute h-7 w-7" />
						</button> */}
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
					</div>
				</div>
			</div>
		</div>
	);
}
