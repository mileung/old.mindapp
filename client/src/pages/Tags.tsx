import { usePing } from '../utils/api';

export type Tags = {
	tag: string;
	subsetOf: string[];
	subsets: string[];
}[];

const tags = new Set([]);

export default function Tags() {
	const { data } = usePing<Tags>('get-tags', { spaceId: window.location.host });
	console.log('data:', data);

	return (
		<div className="p-3">
			<p className="text-2xl font-semibold">Tags</p>
			{data?.length ? (
				data.map(({ tag }) => {
					return (
						<p key={tag} className="">
							{tag}
						</p>
					);
				})
			) : (
				<p className="">No tags</p>
			)}
		</div>
	);
}
