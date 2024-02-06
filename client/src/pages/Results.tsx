import { useSearchParams } from 'react-router-dom';
import { Note } from '../components/NoteBlock';
import { buildUrl, usePinger } from '../utils/api';

export default function Results() {
	const [searchParams] = useSearchParams();
	const searchedKeywords = searchParams.get('search') || '';
	const { data } = usePinger<Note[]>(buildUrl('get-local-notes', { searchedKeywords }));
	// console.log('data:', data);

	return (
		<div className="p-3">
			<p className="text-2xl font-semibold">Results</p>
		</div>
	);
}
