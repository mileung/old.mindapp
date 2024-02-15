import {
	ArrowTopRightOnSquareIcon,
	MinusIcon,
	PencilIcon,
	PlusIcon,
	XMarkIcon,
} from '@heroicons/react/16/solid';
import { useContext, useMemo, useState } from 'react';
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
	parentId,
	roots,
	onRootsChange,
	rootsIndices,
	thought,
	depth = 0,
}: {
	parentId?: string;
	roots: (null | RecThought)[];
	onRootsChange: (newRoots: (null | RecThought)[]) => void;
	rootsIndices: number[];
	thought: RecThought;
	depth?: number;
}) {
	const [editing, editingSet] = useState(false);
	const [open, openSet] = useState(true);
	const [linking, linkingSet] = useState(false);
	const thoughId = useMemo(
		() => thought.createDate + '.' + thought.authorId + '.' + thought.spaceId,
		[thought],
	);

	return (
		<div className={`flex rounded ${depth % 2 === 0 ? 'bg-bg2' : 'bg-bg1'}`}>
			<button
				className="w-5 z-10 fy transition rounded text-fg2 hover:text-fg1 hover:bg-mg2"
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
							<ThoughtWriter
								editId={thoughId}
								parentId={parentId}
								initialContent={thought.content}
								initialTags={thought.tags}
								onWrite={(thought) => {
									editingSet(false);
									const newRoots = [...roots] as RecThought[];
									let pointer = newRoots;
									for (let i = 0; i < rootsIndices.length - 1; i++) {
										pointer = pointer[rootsIndices[i]].children!;
									}
									pointer[rootsIndices[rootsIndices.length - 1]] = thought;
									onRootsChange(newRoots);
								}}
							/>
						</div>
					) : (
						<>
							{thought.content ? (
								<p className="whitespace-pre-wrap break-all font-medium">{thought.content}</p>
							) : (
								<p className="font-semibold text-fg2 italic">No content</p>
							)}
							{!!thought.tags?.length && (
								<div className="flex flex-wrap gap-x-2">
									{thought.tags.map((tag) => {
										const queryString = new URLSearchParams({
											q: `[${tag}]`, // TODO: tag page
										}).toString();
										return (
											<Link
												key={tag}
												to={`/search?${queryString}`}
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
					<div className="mt-2 fx gap-2 text-fg2">
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
							<ThoughtWriter
								parentId={thoughId}
								onWrite={(thought) => {
									linkingSet(false);
									const newRoots = [...roots] as RecThought[];
									let pointer = newRoots;
									for (let i = 0; i < rootsIndices.length; i++) {
										if (!pointer[rootsIndices[i]].children) {
											pointer[rootsIndices[i]].children = [];
										}
										pointer = pointer[rootsIndices[i]].children!;
									}
									pointer.push(thought);
									onRootsChange(newRoots);
								}}
							/>
						</div>
					)}
					{thought.children && (
						<div className="mt-1 space-y-1">
							{thought.children.map(
								(childThought, i) =>
									childThought && (
										<ThoughtBlock
											key={i}
											parentId={thoughId}
											roots={roots}
											onRootsChange={onRootsChange}
											rootsIndices={[...rootsIndices, i]}
											thought={childThought}
											depth={depth + 1}
										/>
									),
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
