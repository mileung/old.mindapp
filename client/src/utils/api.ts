export function buildUrl(basePath: string, params?: Record<string, any>) {
	let url: string;
	if (!params) {
		url = `http://localhost:2000/${basePath}`;
	} else {
		const queryString = Object.keys(params)
			.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
			.join('&');

		url = `http://localhost:2000/${basePath}?${queryString}`;
	}
	// console.log('url:', url);
	return url;
}

export const ping = <T>(...args: Parameters<typeof fetch>): Promise<T> =>
	new Promise((resolve, reject) => {
		fetch(...args).then(async (res) => {
			const json = await res.json();
			return res.status === 200 ? resolve(json) : reject(json);
		});
	});

export const post = (body: object) => ({
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(body),
});
