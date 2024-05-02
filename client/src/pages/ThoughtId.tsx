import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import Results from '../components/Results';
import { isThoughtId } from '../utils/thought';

export default function ThoughtId() {
	const { thoughtId } = useParams();
	const validThoughtId = useMemo(() => thoughtId && isThoughtId(thoughtId), [thoughtId]);

	return (
		<div className="p-3">
			{validThoughtId ? (
				<Results urlQuery={{ thoughtId }} />
			) : (
				<div className="xy h-40">
					<p className="text-2xl">Invalid thought ID in URL</p>
				</div>
			)}
		</div>
	);
}
