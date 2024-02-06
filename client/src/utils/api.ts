import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCache } from '../components/GlobalState';

export function buildUrl(basePath: string, params?: Record<string, any>) {
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

export const pinger = <T>(...args: Parameters<typeof fetch>): Promise<T> =>
	new Promise((resolve, reject) => {
		fetch(...args).then(async (res) => {
			const json = await res.json();
			return res.status === 200 ? resolve(json) : reject(json);
		});
	});

export const usePinger = <T>(...args: Parameters<typeof fetch>) => {
	const cacheKey = useMemo(() => JSON.stringify(args), [args]);
	const [cache, cacheSet] = useCache();
	const data = useMemo<null | T>(() => cache.get(cacheKey) || null, [cache, args]);
	const [loading, loadingSet] = useState(data === null);
	const [error, errorSet] = useState<null | string>(null);
	const [flip, flipSet] = useState(false);

	const refresh = useCallback(() => {
		flipSet(!flip);
		loadingSet(true);
		loadingSet(true);
	}, [flip]);

	useEffect(() => {
		!data && loadingSet(true);
	}, [data]);

	useEffect(() => {
		pinger<T>(...args)
			.then((res) => {
				const map = cache;
				map.set(cacheKey, res);
				cacheSet(map);
			})
			.catch((err) => errorSet(err))
			.finally(() => loadingSet(false));
	}, [cacheKey, JSON.stringify(args), flip]);

	return { data, loading, error, refresh };
};
