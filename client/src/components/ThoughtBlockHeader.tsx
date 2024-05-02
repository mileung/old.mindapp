import {
	CubeIcon,
	ArrowDownTrayIcon,
	CubeTransparentIcon,
	DocumentCheckIcon,
	FingerPrintIcon,
} from '@heroicons/react/16/solid';
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Thought, getThoughtId } from '../utils/ClientThought';
import { formatTimestamp } from '../utils/time';
import DeterministicVisualId from './DeterministicVisualId';
import { useFetchedSpaces, useNames, useSavedFileThoughtIds } from '../utils/state';
import { makeUrl, ping, post } from '../utils/api';
import { copyToClipboardAsync } from '../utils/js';

export default function ThoughtBlockHeader({
	thought,
	parsed,
	parsedSet,
}: {
	thought: Thought;
	parsed: boolean;
	parsedSet: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const [names] = useNames();
	const [fetchedSpaces] = useFetchedSpaces();
	const [savedFileThoughtIds, savedFileThoughtIdsSet] = useSavedFileThoughtIds();
	const thoughtId = useMemo(() => getThoughtId(thought), [thought]);
	const filedSaved = useMemo(
		() => savedFileThoughtIds[thoughtId],
		[savedFileThoughtIds[thoughtId]],
	);

	useEffect(() => {
		// OPTIMIZE: Results component could recursively set this
		savedFileThoughtIdsSet((old) => ({
			...old, //
			[thoughtId]: !!thought.filedSaved,
		}));
	}, []);

	return (
		<div className="mr-1 fx gap-2 text-fg2">
			<Link
				target="_blank"
				to={`/thought/${thoughtId}`}
				className="text-sm font-bold transition text-fg2 hover:text-fg1"
			>
				{formatTimestamp(thought.createDate)}
			</Link>
			<Link
				target="_blank"
				to={`/search?${new URLSearchParams({ q: `@${thought.authorId || ''}` }).toString()}`}
				className={`fx text-sm font-bold transition text-fg2 hover:text-fg1 ${names[thought.authorId || ''] ? '' : 'italic'}`}
			>
				<DeterministicVisualId
					input={thought.authorId}
					className="rounded-full overflow-hidden h-3 w-3 mr-1"
				/>
				{thought.authorId ? names[thought.authorId] || 'No name' : 'Anon'}
			</Link>
			<Link
				target="_blank"
				to={`/search?${new URLSearchParams({ q: `@${thought.spaceHost || ''}` }).toString()}`}
				className={`fx text-sm font-bold transition text-fg2 hover:text-fg1 ${thought.spaceHost ? '' : 'italic'}`}
			>
				<DeterministicVisualId
					input={thought.spaceHost}
					className="rounded-sm overflow-hidden h-3 w-3 mr-1"
				/>
				{thought.spaceHost ? fetchedSpaces[thought.spaceHost]?.name || 'No name' : 'Local'}
			</Link>
			<button
				className="ml-auto h-4 w-4 xy hover:text-fg1 transition"
				onClick={() => copyToClipboardAsync(`${thoughtId}`)}
			>
				<FingerPrintIcon className="absolute h-4 w-4" />
			</button>
			<button className="h-4 w-4 xy hover:text-fg1 transition" onClick={() => parsedSet(!parsed)}>
				{parsed ? (
					<CubeIcon className="absolute h-4 w-4" />
				) : (
					<CubeTransparentIcon className="absolute h-4 w-4" />
				)}
			</button>
			{/* <button
				className="h-4 w-4 xy hover:text-fg1 transition"
				onClick={() => {
					savedFileThoughtIdsSet({ ...savedFileThoughtIds, [thoughtId]: !filedSaved });
					ping(
						makeUrl('write-local-file'),
						post({ thought })
					);
				}}
			>
				{filedSaved ? (
					<DocumentCheckIcon className="absolute h-4 w-4" />
				) : (
					<ArrowDownTrayIcon className="absolute h-4 w-4 text-" />
				)}
			</button> */}
		</div>
	);
}
