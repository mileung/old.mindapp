export function buildUrl(basePath: string, params?: Record<string, any>) {
	let url: string;
	if (!params) {
		url = `http://localhost:2000/${basePath}`;
	} else {
		url = `http://localhost:2000/${basePath}?${new URLSearchParams(params).toString()}`;
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
