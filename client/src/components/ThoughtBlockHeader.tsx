import { CubeIcon, CubeTransparentIcon, FingerPrintIcon } from '@heroicons/react/16/solid';
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Thought, getThoughtId } from '../utils/ClientThought';
import { copyToClipboardAsync } from '../utils/js';
import { useFetchedSpaces, useAuthors, useSavedFileThoughtIds } from '../utils/state';
import { formatTimestamp } from '../utils/time';
import DeterministicVisualId from './DeterministicVisualId';
import { localClientHost } from '../utils/api';

export default function ThoughtBlockHeader({
	thought,
	parsed,
	parsedSet,
}: {
	thought: Thought;
	parsed: boolean;
	parsedSet: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const [authors] = useAuthors();
	const [fetchedSpaces] = useFetchedSpaces();
	const [savedFileThoughtIds, savedFileThoughtIdsSet] = useSavedFileThoughtIds();
	const thoughtId = useMemo(() => getThoughtId(thought), [thought]);
	const filedSaved = useMemo(
		() => savedFileThoughtIds[thoughtId],
		[savedFileThoughtIds[thoughtId]],
	);
	const spaceUrl = useMemo(() => {
		const { protocol, host } = new URL(
			`http${thought.spaceHost && !thought.spaceHost.startsWith('localhost') ? 's' : ''}:${thought.spaceHost || localClientHost}`,
		);
		const parts = host.split('.').reverse();
		const tld = parts[0];
		const sld = parts[1];
		return `${protocol}//${
			thought.spaceHost && tld && sld ? `${sld}.${tld}` : localClientHost
		}/${thoughtId}`;
	}, [thought]);

	useEffect(() => {
		// OPTIMIZE: Results component could recursively set this
		savedFileThoughtIdsSet((old) => ({
			...old, //
			[thoughtId]: !!thought.filedSaved,
		}));
	}, []);

	return (
		<div className="mr-1 fx gap-2 text-fg2 max-w-full">
			<Link
				target="_blank"
				to={`/${thoughtId}`}
				className="text-sm font-bold transition text-fg2 hover:text-fg1"
			>
				{formatTimestamp(thought.createDate)}
			</Link>
			<Link
				target="_blank"
				to={`/@${thought.authorId || ''}`}
				className={`fx text-sm font-bold transition text-fg2 hover:text-fg1 ${authors[thought.authorId || ''] ? '' : 'italic'}`}
			>
				<DeterministicVisualId
					input={thought.authorId}
					className="rounded-full overflow-hidden h-3 w-3 mr-1"
				/>
				<p className="whitespace-nowrap">
					{thought.authorId ? authors[thought.authorId]?.name || 'No name' : 'Anon'}
				</p>
			</Link>
			<a
				target="_blank"
				href={spaceUrl}
				className={`fx text-sm font-bold transition text-fg2 hover:text-fg1 ${thought.spaceHost ? '' : 'italic'}`}
			>
				<DeterministicVisualId
					input={fetchedSpaces[thought.spaceHost || '']}
					className="rounded-sm overflow-hidden h-3 w-3 mr-1"
				/>
				<p className="whitespace-nowrap">
					{thought.spaceHost ? fetchedSpaces[thought.spaceHost]?.name || 'No name' : 'Local'}
				</p>
			</a>
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
