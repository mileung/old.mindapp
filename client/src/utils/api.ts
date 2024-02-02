import { useEffect, useState } from 'react';

export function buildUrl(basePath: string, params?: { [key: string]: any }) {
	let url: string;
	if (!params) {
		url = `http://localhost:3000/${basePath}`;
	} else {
		const queryString = Object.keys(params)
			.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
			.join('&');

		url = `http://localhost:3000/${basePath}?${queryString}`;
	}
	// console.log('url:', url);
	return url;
}

export const fetcher = <T>(...args: Parameters<typeof fetch>): Promise<T> =>
	fetch(...args).then((res) => res.json());

// keep it simple for now
export const usePing = <T>(...args: Parameters<typeof buildUrl>) => {
	const [data, dataSet] = useState<null | T>(null);
	const [loading, loadingSet] = useState(true);
	const [error, errorSet] = useState<null | string>(null);
	useEffect(() => {
		fetcher<T>(buildUrl(...args))
			.then((res) => dataSet(res))
			.catch((err) => errorSet(err))
			.finally(() => loadingSet(false));
	}, []);
	return { data, loading, error };
};
