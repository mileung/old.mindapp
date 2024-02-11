import { useSearchParams } from 'react-router-dom';

export default function Results() {
	const [searchParams] = useSearchParams();
	const searchedKeywords = searchParams.get('search') || '';

	return (
		<div className="p-3">
			<p className="text-2xl font-semibold">results</p>
		</div>
	);
}
