export function isRecord(value: unknown) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isStringifiedRecord(value?: string) {
	if (!value) return false;
	try {
		const obj = JSON.parse(value);
		return isRecord(obj);
	} catch (error) {}
	return false;
}

export const shortenString = (str: string, startCount = 5, endCount = 5) => {
	if (str.length <= startCount + endCount) {
		return str;
	}
	return str.slice(0, startCount) + '~' + str.slice(-endCount);
};

export function sortRecursiveEntries(obj: Record<string, any>): [string, any][] {
	return Object.entries(obj)
		.sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()))
		.map(([key, val]) => [key, isRecord(val) ? sortRecursiveEntries(val) : val]);
}
