import { Link } from 'react-router-dom';
import { formatTimestamp } from '../utils/time';

export default function MiniMentionedThought({ thoughtId }: { thoughtId: string }) {
	return (
		<Link
			target="_blank"
			to={`/${thoughtId}`}
			className="px-1 border border-mg2 rounded text-sm font-bold transition text-fg2 hover:border-fg1 hover:text-fg1"
		>
			{formatTimestamp(+thoughtId.substring(0, thoughtId.indexOf('_')))}
		</Link>
	);
}
