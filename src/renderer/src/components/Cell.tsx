import {
	ArrowTopRightOnSquareIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	FaceSmileIcon,
	MinusIcon,
	PlusIcon,
} from '@heroicons/react/16/solid';
import { useState } from 'react';
import { formatTimestamp } from '../utils/time';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkedIcon } from '@heroicons/react/24/solid';
import TimeAgo from './TimeAgo';

export default function Cell({ date, note }: { date: number; note: string }) {
	const [open, openSet] = useState(true);
	const [marked, markedSet] = useState(false);

	return (
		<div className="flex bg-bg2 rounded">
			<button
				className="w-5 fy transition rounded-l text-fg2 hover:text-fg1 hover:bg-mg3"
				onClick={() => openSet(!open)}
			>
				<div className="justify-self-start mt-1">
					{open ? <MinusIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
				</div>
			</button>
			<div className="p-1">
				<p className="text-sm text-fg2 font-bold">{formatTimestamp(date)}</p>
				<div className={`${open ? '' : 'hidden'}`}>
					<pre className="">{note}</pre>
					<div className="fx gap-2 text-fg2 text-xs font-bold">
						{/* <button className="h-4 w-4 xy">
							<ChevronUpIcon className="absolute h-7 w-7" />
						</button>
						<button className="h-4 w-4 xy">
							<ChevronDownIcon className="absolute h-7 w-7" />
						</button> */}
						<button className="h-4 w-4 xy">
							<FaceSmileIcon className="absolute h-4 w-4" />
						</button>
						<button className="h-4 w-4 xy">
							<ArrowTopRightOnSquareIcon className="absolute rotate-90 h-5 w-5" />
						</button>
						<button className="h-4 w-4 xy" onClick={() => markedSet(!marked)}>
							{marked ? (
								<BookmarkedIcon className="absolute h-5 w-5" />
							) : (
								<BookmarkIcon className="absolute h-5 w-5" />
							)}
						</button>
						{/* <button className="">Reference</button>
						<button className="">Bookmark</button> */}
					</div>
				</div>
			</div>
		</div>
	);
}
