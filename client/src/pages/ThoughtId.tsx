import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import Results from '../components/Results';

const thoughtIdRegex = /^\d{13}\.(null|\d{13})\.(null|\d{13})$/;

export default function ThoughtId() {
	const { pathname } = useLocation();
	const thoughtId = useMemo(() => pathname.substring(1), [pathname]);
	const validThoughtId = useMemo(() => thoughtIdRegex.test(thoughtId), [thoughtId]);

	return (
		<div className="p-3">
			{validThoughtId ? (
				<Results query={{ thoughtId }} />
			) : (
				<div className="xy h-40">
					<p className="text-2xl">Invalid thought ID in URL</p>
				</div>
			)}
		</div>
	);
}
