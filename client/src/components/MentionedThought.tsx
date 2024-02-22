import {
	DocumentArrowDownIcon,
	DocumentArrowUpIcon,
	FingerPrintIcon,
} from '@heroicons/react/16/solid';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatTimestamp } from '../utils/time';
import ContentParser from './ContentParser';
import { Thought, copyToClipboardAsync, getThoughtId } from './ThoughtBlock';

export default function MentionedThought({ thought }: { thought?: Thought }) {
	// console.log('thought:', thought);
	if (!thought) return null;

	const [markdown, markdownSet] = useState(true);
	const thoughtId = useMemo(() => getThoughtId(thought), [thought]);

	return (
		<div className={`py-1 px-1.5 border border-mg2 rounded`}>
			<div className="fx gap-2 text-fg2">
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
			{thought.content ? (
				markdown ? (
					<ContentParser disableMentions content={thought.content} />
				) : (
					<p className="whitespace-pre-wrap break-all font-thin font-mono">{thought.content}</p>
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
		</div>
	);
}
