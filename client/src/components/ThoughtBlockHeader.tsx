import {
	DocumentArrowDownIcon,
	DocumentArrowUpIcon,
	FingerPrintIcon,
} from '@heroicons/react/16/solid';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RecThought, copyToClipboardAsync, getThoughtId } from '../utils/thought';
import { formatTimestamp } from '../utils/time';
import DeterministicVisualId from './DeterministicVisualId';
import { useDefaultNames } from '../utils/state';

export default function ThoughtBlockHeader({
	thought,
	markdownSet,
	markdown,
}: {
	thought: RecThought;
	markdownSet: React.Dispatch<React.SetStateAction<boolean>>;
	markdown: boolean;
}) {
	const [defaultNames] = useDefaultNames();
	const thoughtId = useMemo(() => getThoughtId(thought), [thought]);

	return (
		<div className="mr-1 fx gap-2 text-fg2">
			<Link
				target="_blank"
				to={`/search?${new URLSearchParams({ q: `@${thought.authorId}` }).toString()}`}
				className={`fx text-sm font-bold transition ${defaultNames[thought.authorId] ? 'text-fg1 hover:underline' : 'text-fg2 hover:text-fg1'}`}
			>
				<div className="rounded-full overflow-hidden h-3 w-3 mr-1">
					<DeterministicVisualId input={thought.authorId} />
				</div>
				{thought.authorId ? defaultNames[thought.authorId] || 'No name' : 'Anon'}
			</Link>
			<Link
				target="_blank"
				to={`/search?${new URLSearchParams({ q: `@${thought.authorId}` }).toString()}`}
				className="fx text-sm font-bold transition text-fg2 hover:text-fg1"
			>
				<div className="rounded-sm overflow-hidden h-3 w-3 mr-1">
					<DeterministicVisualId input={thought.spaceId} />
				</div>
				{thought.spaceId ? 'No name' : 'Local'}
			</Link>
			<Link
				target="_blank"
				to={`/thought/${thoughtId}`}
				className="mr-auto text-sm font-bold transition text-fg2 hover:text-fg1"
			>
				{formatTimestamp(thought.createDate)}
			</Link>
			<button
				className="h-4 w-4 xy hover:text-fg1 transition"
				onClick={() => copyToClipboardAsync(`${thoughtId}`)}
			>
				<FingerPrintIcon className="absolute h-4 w-4" />
			</button>
			<button
				className="h-4 w-4 xy hover:text-fg1 transition"
				onClick={() => markdownSet(!markdown)}
			>
				{markdown ? (
					<DocumentArrowDownIcon className="absolute h-4 w-4" />
				) : (
					<DocumentArrowUpIcon className="absolute h-4 w-4" />
				)}
			</button>
		</div>
	);
}
