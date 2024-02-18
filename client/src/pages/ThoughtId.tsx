import { useLocation } from 'react-router-dom';
import ThoughtBlock, { Thought } from '../components/ThoughtBlock';
import { useEffect, useMemo, useState } from 'react';
import { buildUrl, ping } from '../utils/api';

const thoughtIdRegex = /^\d{13}\.(null|\d{13})\.(null|\d{13})$/;

export default function ThoughtId() {
	const { pathname } = useLocation();
	const thoughtId = useMemo(() => pathname.substring(1), [pathname]);
	const [rootThought, rootThoughtSet] = useState<null | Thought>();
	const [invalidThoughtId, invalidThoughtIdSet] = useState(false);

	useEffect(() => {
		if (!thoughtIdRegex.test(thoughtId)) return invalidThoughtIdSet(true);
		ping<{ rootThought: null | Thought }>(buildUrl('get-thought', { thoughtId }))
			.then(({ rootThought }) => rootThoughtSet(rootThought))
			.catch((err) => alert(JSON.stringify(err)));
	}, []);

	return (
		<div className="p-3">
			{invalidThoughtId && (
				<div className="xy h-40">
					<p className="text-2xl">Invalid thought ID in URL</p>
				</div>
			)}
			{rootThought === null && (
				<div className="xy h-40">
					<p className="text-2xl">Thought not found</p>
				</div>
			)}
			{rootThought && (
				<ThoughtBlock
					highlightedId={thoughtId}
					parentId={rootThought.parentId}
					roots={[rootThought]}
					onRootsChange={(newRoots) => rootThoughtSet(newRoots[0])}
					rootsIndices={[0]}
					thought={rootThought}
				/>
			)}
		</div>
	);
}
