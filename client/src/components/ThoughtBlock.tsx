import {
	ArrowTopRightOnSquareIcon,
	FingerPrintIcon,
	MinusIcon,
	PencilIcon,
	PlusIcon,
	XMarkIcon,
	DocumentArrowDownIcon,
	DocumentArrowUpIcon,
} from '@heroicons/react/16/solid';
import { ReactNode, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatTimestamp } from '../utils/time';
import { ThoughtWriter } from './ThoughtWriter';
import ContentParser from './ContentParser';

export type Thought = {
	createDate: number;
	authorId: null | number;
	spaceId: null | number;
	content: string | string[];
	tagLabels?: string[];
	parentId?: string;
	childrenIds?: string[];
};

export type RecThought = {
	createDate: number;
	authorId: null | number;
	spaceId: null | number;
	content: string | string[];
	tagLabels?: string[];
	parent?: RecThought[];
	children?: RecThought[];
};

export function getThoughtId(thought: Thought) {
	return `${thought.createDate}.${thought.authorId}.${thought.spaceId}`;
}

export const copyToClipboardAsync = (str = '') => {
	if (navigator && navigator.clipboard && navigator.clipboard.writeText)
		return navigator.clipboard.writeText(str);
	return window.alert('The Clipboard API is not available.');
};

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
	onMentions,
	rootsIndices,
	mentionedThoughts,
	depth = 0,
	initiallyLinking,
	highlightedId,
	parentId,
}: {
	thought: RecThought;
	roots: (null | RecThought)[];
	onRootsChange: (newRoots: (null | RecThought)[]) => void;
	onMentions: (mentionedThoughts: Record<string, Thought>) => void;
	rootsIndices: number[];
	mentionedThoughts: Record<string, Thought>;
	depth?: number;
	initiallyLinking?: boolean;
	highlightedId?: string;
	parentId?: string;
}) {
	const [editing, editingSet] = useState(false);
	const [open, openSet] = useState(true);
	const [linking, linkingSet] = useState(!!initiallyLinking);
	const [markdown, markdownSet] = useState(true);
	const thoughtId = useMemo(() => getThoughtId(thought), [thought]);
	const highlighted = useMemo(() => highlightedId === thoughtId, [highlightedId, thoughtId]);
	const linkingThoughtId = useRef('');

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
					<div className="mr-1 fx gap-2 text-fg2">
						<Link
							target="_blank"
							to={`/${thoughtId}`}
							className="text-sm font-bold transition text-fg2 hover:text-fg1"
						>
							{formatTimestamp(thought.createDate)}
						</Link>
						<button
							className="ml-auto h-4 w-4 xy hover:text-fg1 transition"
							onClick={() => markdownSet(!markdown)}
						>
							{markdown ? (
								<DocumentArrowDownIcon className="absolute h-4 w-4" />
							) : (
								<DocumentArrowUpIcon className="absolute h-4 w-4" />
							)}
						</button>
						<button
							className="h-4 w-4 xy hover:text-fg1 transition"
							onClick={() => copyToClipboardAsync(`${thoughtId}`)}
						>
							<FingerPrintIcon className="absolute h-4 w-4" />
						</button>
					</div>
					<div className={`pb-1 pr-1 ${open ? '' : 'hidden'}`}>
						{editing ? (
							<div className="mt-1">
								<ThoughtWriter
									editId={thoughtId}
									parentId={parentId}
									onContentBlur={() => editingSet(false)}
									initialContent={thought.content}
									initialTagLabels={thought.tagLabels}
									onWrite={({ mentionedThoughts, thought }, shiftKey, altKey) => {
										onMentions(mentionedThoughts);
										editingSet(false);
										altKey && linkingSet(true);
										shiftKey && (linkingThoughtId.current = getThoughtId(thought));
										const newRoots = [...roots] as RecThought[];
										let pointer = newRoots;
										for (let i = 0; i < rootsIndices.length - 1; i++) {
											pointer = pointer[rootsIndices[i]].children!;
										}
										const editedThought = pointer[rootsIndices[rootsIndices.length - 1]];
										editedThought.content = thought.content;
										editedThought.tagLabels = thought.tagLabels;
										onRootsChange(newRoots);
									}}
								/>
							</div>
						) : (
							<>
								{thought.content ? (
									markdown ? (
										<ContentParser
											mentionedThoughts={mentionedThoughts}
											content={thought.content}
										/>
									) : (
										<p className="whitespace-pre-wrap break-all font-thin font-mono">
											{thought.content}
										</p>
									)
								) : (
									<p className="font-semibold text-fg2 italic">No content</p>
								)}
								{!!thought.tagLabels?.length && (
									<div className="flex flex-wrap gap-x-2">
										{thought.tagLabels.map((label) => {
											const queryString = new URLSearchParams({
												q: `[${label}]`, // TODO: tag page
											}).toString();
											return (
												<Link
													key={label}
													to={`/search?${queryString}`}
													className="font-bold leading-5 transition text-fg2 hover:text-fg1"
												>
													{label}
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
						{thought.children && (
							<div className="mt-1 space-y-1">
								{thought.children.map(
									(childThought, i) =>
										childThought && (
											<ThoughtBlock
												key={i}
												mentionedThoughts={mentionedThoughts}
												initiallyLinking={linkingThoughtId.current === getThoughtId(childThought)}
												highlightedId={highlightedId}
												parentId={thoughtId}
												roots={roots}
												onRootsChange={onRootsChange}
												onMentions={onMentions}
												rootsIndices={[...rootsIndices, i]}
												thought={childThought}
												depth={depth + 1}
											/>
										),
								)}
							</div>
						)}
						{linking && (
							<div className={`${depth % 2 === 0 ? 'bg-bg1' : 'bg-bg2'} p-1 rounded mt-1`}>
								<ThoughtWriter
									parentId={thoughtId}
									initialTagLabels={thought.tagLabels}
									onContentBlur={() => linkingSet(false)}
									onWrite={({ mentionedThoughts, thought }, shiftKey, altKey) => {
										onMentions(mentionedThoughts);
										!altKey && linkingSet(false);
										shiftKey && (linkingThoughtId.current = getThoughtId(thought));
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
					</div>
				</div>
			</div>
		</Highlight>
	);
}

// // https://github.com/developit/snarkdown/issues/11#issuecomment-1232574727
// // https://github.com/developit/snarkdown/issues/75
// function snarkdownEnhanced(markdown: string = '') {
// 	return markdown
// 		.split(/(?:\r?\n){2,}/)
// 		.map((l) =>
// 			[' ', '\t', '#', '- ', '* ', '> '].some((char) => l.startsWith(char))
// 				? snarkdown(l)
// 				: `<p>${snarkdown(l)}</p>`
// 		)
// 		.join('\n');
// }

// // https://github.com/developit/snarkdown/issues/70#issuecomment-626863373
// export function safeContentParser(markdown: string, ) {
// 	// const html = snarkdown(markdown);
// 	const html = snarkdownEnhanced(markdown);
// 	const doc = parse(html);
// 	_sanitize(doc, );
// 	return doc.innerHTML;
// }
// function _sanitize(node: HTMLElement, ) {
// 	if (node.nodeType === 3) return;
// 	if (
// 		node.nodeType !== 1 ||
// 		// node.rawTagName === 'br' ||
// 		/^(script|iframe|object|embed|svg)$/i.test(node.tagName)
// 	) {
// 		return node.remove();
// 	}

// 	if (node.tagName === 'A') {
// 		node.setAttribute('target', '_blank');
// 	}

// 	for (const name in node.attributes) {
// 		if (Object.prototype.hasOwnProperty.call(node.attributes, name)) {
// 			if (!/^(class|id|name|href|src|alt|align|valign)$/i.test(name)) {
// 				delete node.attributes[name];
// 			}
// 		}
// 	}

// 	node.childNodes.forEach((node) => _sanitize(node as HTMLElement, ));
// }
