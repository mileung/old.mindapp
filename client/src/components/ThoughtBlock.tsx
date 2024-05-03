import {
	ArrowTopRightOnSquareIcon,
	EllipsisHorizontalIcon,
	MinusIcon,
	PencilIcon,
	PlusIcon,
	TrashIcon,
	XMarkIcon,
} from '@heroicons/react/16/solid';
import { ReactNode, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildUrl, ping, post } from '../utils/api';
import { isStringifiedRecord } from '../utils/js';
import { useActiveSpace, useSendMessage, usePersonas } from '../utils/state';
import { Thought, getThoughtId } from '../utils/ClientThought';
import { minute } from '../utils/time';
import ContentParser from './ContentParser';
import ThoughtBlockHeader from './ThoughtBlockHeader';
import { ThoughtWriter } from './ThoughtWriter';

function Highlight({
	shadow,
	on,
	children,
}: {
	shadow: boolean;
	on: boolean;
	children: ReactNode;
}) {
	const scrolledTo = useRef(false);
	return on ? (
		<div
			ref={(r) => {
				!scrolledTo.current &&
					r &&
					setTimeout(() => {
						const yOffset = -50; // so header doesn't cover thought block
						window.scrollTo({ top: r.getBoundingClientRect().top + window.scrollY + yOffset });
						scrolledTo.current = true;
					}, 0);
			}}
			className={`${shadow && 'shadow'} rounded bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 p-0.5`}
		>
			{children}
		</div>
	) : (
		<>{children}</>
	);
}

export default function ThoughtBlock({
	thought,
	roots,
	onRootsChange,
	onNewRoot = () => {},
	rootsIndices,
	depth = 0,
	initiallyLinking,
	highlightedId,
}: {
	thought: Thought;
	roots: (null | Thought)[];
	onRootsChange: (newRoots: (null | Thought)[]) => void;
	onNewRoot?: () => void;
	rootsIndices: number[];
	depth?: number;
	initiallyLinking?: boolean;
	highlightedId?: string;
}) {
	const activeSpace = useActiveSpace();
	const [personas] = usePersonas();
	const sendMessage = useSendMessage();
	const [moreOptionsOpen, moreOptionsOpenSet] = useState(false);
	const [editing, editingSet] = useState(false);
	const [open, openSet] = useState(true);
	const [linking, linkingSet] = useState(!!initiallyLinking);
	const [parsed, parsedSet] = useState(true);
	const thoughtId = useMemo(() => getThoughtId(thought), [thought]);
	const highlighted = useMemo(() => highlightedId === thoughtId, [highlightedId, thoughtId]);
	const linkingThoughtId = useRef('');
	const linkingDiv = useRef<HTMLDivElement>(null);

	return (
		<Highlight on={highlighted} shadow={!depth}>
			<div
				className={`flex rounded ${!depth && !highlighted ? 'shadow' : ''} ${depth % 2 === 0 ? 'bg-bg2' : 'bg-bg1'}`}
			>
				<button
					className="w-5 z-10 fy transition rounded text-fg2 hover:text-fg1 hover:bg-mg2"
					onClick={() => openSet(!open)}
				>
					<div className="my-0.5">
						{open ? <MinusIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
					</div>
				</button>
				<div className="mt-0.5 flex-1">
					<ThoughtBlockHeader thought={thought} parsedSet={parsedSet} parsed={parsed} />
					<div className={`pb-1 pr-1 ${open ? '' : 'hidden'}`}>
						{editing ? (
							<div className="mt-1">
								<ThoughtWriter
									editId={thoughtId}
									parentId={thought.parentId}
									onContentBlur={() => editingSet(false)}
									initialContent={thought.content}
									initialTags={thought.tags}
									onWrite={({ thought }, ctrlKey, altKey) => {
										editingSet(false);
										moreOptionsOpenSet(false);
										ctrlKey && linkingSet(true);
										altKey && onNewRoot();
										const newRoots = [...roots] as Thought[];
										let pointer = newRoots;
										for (let i = 0; i < rootsIndices.length - 1; i++) {
											pointer = pointer[rootsIndices[i]].children!;
										}
										const editedThought = pointer[rootsIndices.slice(-1)[0]];
										editedThought.content = thought.content;
										editedThought.tags = thought.tags;
										onRootsChange(newRoots);
									}}
								/>
							</div>
						) : (
							<>
								{thought.content ? (
									parsed ? (
										<ContentParser thought={thought} />
									) : (
										<p className="whitespace-pre-wrap break-all font-thin font-mono">
											{isStringifiedRecord(thought.content)
												? JSON.stringify(JSON.parse(thought.content), null, 2)
												: thought.content}
										</p>
									)
								) : (
									<p className="font-semibold text-fg2 italic">No content</p>
								)}
								{!!thought.tags?.length && (
									<div className="flex flex-wrap gap-x-2">
										{thought.tags.map((tag) => (
											<Link
												key={tag}
												target="_blank"
												to={`/search?${new URLSearchParams({ q: `[${tag}]` }).toString()}`}
												className="font-bold leading-5 transition text-fg2 hover:text-fg1"
											>
												{tag}
											</Link>
										))}
									</div>
								)}
							</>
						)}
						<div className="mt-2 fx gap-2 text-fg2">
							<button
								className="w-full h-4 fx hover:text-fg1 transition"
								onClick={() => linkingSet(!linking)}
							>
								<ArrowTopRightOnSquareIcon className="absolute rotate-90 h-5 w-5" />
							</button>
							{moreOptionsOpen ? (
								<>
									<button
										className="h-4 w-4 xy hover:text-fg1 transition"
										onClick={() => moreOptionsOpenSet(false)}
									>
										<XMarkIcon className="absolute h-6 w-6" />
									</button>
									<button
										className="h-4 w-4 xy hover:text-fg1 transition"
										onClick={async () => {
											const ok = !thought.spaceHost
												? Date.now() - thought.createDate < minute ||
													confirm(
														'This thought has already been archived in the Git snapshot history; delete it anyways?',
													)
												: confirm('Are you sure you want to delete this thought?');
											if (!ok) return;
											const newRoots = [...roots] as Thought[];
											let pointer = newRoots;
											for (let i = 0; i < rootsIndices.length - 1; i++) {
												pointer = pointer[rootsIndices[i]].children!;
											}
											const deletedThought = pointer[rootsIndices.slice(-1)[0]];
											sendMessage<{ softDelete: true }>({
												from: personas[0]!.id,
												to: buildUrl({ host: activeSpace!.host, path: 'delete-thought' }),
												thoughtId,
											})
												.then(({ softDelete }) => {
													if (softDelete) {
														deletedThought.content = '';
														deletedThought.tags = [];
													} else {
														pointer.splice(rootsIndices.slice(-1)[0], 1);
													}
													onRootsChange(newRoots);
												})
												.catch((err) => alert(err));
										}}
									>
										<TrashIcon className="absolute h-4 w-4" />
									</button>
									<button
										className="h-4 w-4 xy hover:text-fg1 transition"
										onClick={() => editingSet(!editing)}
									>
										<PencilIcon className="absolute h-4 w-4" />
									</button>
								</>
							) : (
								(!personas[0].spaceHosts[0] ||
									(thought.authorId === personas[0].id &&
										(thought.spaceHost || !!thought.content))) && (
									<button
										className="h-4 w-4 xy hover:text-fg1 transition"
										onClick={() => moreOptionsOpenSet(true)}
									>
										<EllipsisHorizontalIcon className="absolute h-5 w-5" />
									</button>
								)
							)}
						</div>
						{thought.children && (
							<div className="mt-1 space-y-1">
								{thought.children.map(
									(childThought, i) =>
										childThought && (
											<ThoughtBlock
												key={i}
												initiallyLinking={linkingThoughtId.current === getThoughtId(childThought)}
												highlightedId={highlightedId}
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
						{linking && (
							<div ref={linkingDiv} className="bg-bg1 p-1 rounded mt-1">
								<ThoughtWriter
									parentId={thoughtId}
									onContentBlur={() => linkingSet(false)}
									onWrite={({ thought }, ctrlKey, altKey) => {
										altKey ? onNewRoot() : linkingSet(false);
										ctrlKey && (linkingThoughtId.current = getThoughtId(thought));
										const newRoots = [...roots] as Thought[];
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
					</div>
				</div>
			</div>
		</Highlight>
	);
}
