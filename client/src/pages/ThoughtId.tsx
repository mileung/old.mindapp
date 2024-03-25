import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import Results from '../components/Results';

const thoughtIdRegex = /^\d{13}\.(null|\d{13})\.(null|\d{13})$/;

export default function ThoughtId() {
	const { thoughtId } = useParams();
	const validThoughtId = useMemo(() => thoughtId && thoughtIdRegex.test(thoughtId), [thoughtId]);

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
