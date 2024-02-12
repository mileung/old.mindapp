import {
	ArrowTopRightOnSquareIcon,
	MinusIcon,
	PencilIcon,
	PlusIcon,
	XMarkIcon,
} from '@heroicons/react/16/solid';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatTimestamp } from '../utils/time';
import { ThoughtWriter } from './ThoughtWriter';

export type Thought = {
	createDate: number;
	authorId: null | number;
	spaceId: null | number;
	content: string;
	tags?: string[];
	parentId?: string;
	childrenIds?: string[];
};

export type RecThought = {
	createDate: number;
	authorId: null | number;
	spaceId: null | number;
	content: string;
	tags?: string[];
	parent?: RecThought[];
	children?: RecThought[];
};

export default function ThoughtBlock({
	thought,
	depth = 0,
}: {
	thought: RecThought;
	depth?: number;
}) {
	const [editing, editingSet] = useState(false);
	const [open, openSet] = useState(true);
	const [linking, linkingSet] = useState(false);
	const thoughId = useMemo(
		() => thought.createDate + '.' + thought.authorId + '.' + thought.spaceId,
		[thought]
	);

	return (
		<div className={`flex rounded ${depth % 2 === 0 ? 'bg-bg2' : 'bg-bg1'}`}>
			<button
				className="w-5 z-10 fy transition rounded-l text-fg2 hover:text-fg1 hover:bg-mg2"
				onClick={() => openSet(!open)}
			>
				<div className="my-0.5">
					{open ? <MinusIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
				</div>
			</button>
			<div className="mt-0.5 flex-1">
				<p className="text-sm text-fg2 font-bold">{formatTimestamp(thought.createDate)}</p>
				<div className={`pb-1 pr-1 ${open ? '' : 'hidden'}`}>
					{editing ? (
						<div className="mt-1">
							<ThoughtWriter editId={thoughId} />
						</div>
					) : (
						<>
							<pre className="">{thought.content}</pre>
							{!!thought.tags?.length && (
								<div className="flex flex-wrap gap-x-2">
									{thought.tags.map((tag) => {
										const queryString = new URLSearchParams({
											search: `[${tag}]`, // TODO: tag page
										}).toString();
										return (
											<Link
												key={tag}
												to={`/results?${queryString}`}
												className="font-bold leading-5 transition text-fg2 hover:text-fg1"
											>
												{tag}
											</Link>
										);
									})}
								</div>
							)}
						</>
					)}
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
						<button
							className="h-4 w-4 xy hover:text-fg1 transition"
							onClick={() => editingSet(!editing)}
						>
							{editing ? (
								<XMarkIcon className="absolute h-6 w-6" />
							) : (
								<PencilIcon className="absolute h-5 w-5" />
							)}
						</button>
						{/* <button className="h-4 w-4 xy hover:text-fg1 transition" onClick={() => {}}>
							<ArrowDownTrayIcon className="absolute h-5 w-5" />
						</button> */}
						{/* <button className="">Reference</button>
						<button className="">Bookmark</button> */}
					</div>
					{linking && (
						<div className={`${depth % 2 === 0 ? 'bg-bg1' : 'bg-bg2'} p-1 rounded mt-1`}>
							<ThoughtWriter parentId={thoughId} onLink={() => linkingSet(false)} />
						</div>
					)}
					{thought.children && (
						<div className="mt-1 space-y-1">
							{thought.children.map((childThought, i) => (
								<ThoughtBlock key={i} thought={childThought} depth={depth + 1} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
