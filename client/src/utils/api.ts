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
