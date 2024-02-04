import { useCallback, useRef } from 'react';
import { buildUrl, fetcher, usePing } from '../utils/api';
import { PlusIcon } from '@heroicons/react/16/solid';

export type Tag = {
	tag: string;
	subsetOf: string[];
	subsets: string[];
};

const tags = new Set([]);

export default function Tags() {
	const taghRef = useRef<null | HTMLInputElement>(null);
	const { data } = usePing<Tag[]>('get-tags');
	console.log('data:', data);

	const addTag = useCallback(() => {
		const value = taghRef.current!.value.trim();
		if (value) {
			console.log('value:', value);
			fetcher(buildUrl('add-tag'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ tag: value }),
			})
				.then((data) => {
					console.log('data', data);
				})
				.catch((err) => {
					console.log('err', err);
				});
		}
	}, []);

	return (
		<div className="p-3">
			<p className="text-2xl font-semibold">Tags</p>
			<div className="mt-2 flex">
				<input
					ref={taghRef}
					className="rounded w-full max-w-sm h-10 text-lg px-2 bg-mg1"
					placeholder="New tag"
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							addTag();
						}
					}}
				/>
				<button className="o" onClick={addTag}>
					<PlusIcon className="h-7 w-7" />
				</button>
			</div>
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
