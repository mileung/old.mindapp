export function isRecord(value: unknown) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isStringRecord(value: unknown) {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		Object.values(value as object).every((v) => typeof v === 'string')
	);
}

export function isJsonRecord(str: unknown): boolean {
	try {
		return isRecord(JSON.parse(str as string));
	} catch (e) {
		return false;
	}
}

export const shortenString = (str: string, startCount = 5, endCount = 5) => {
	if (str.length <= startCount + endCount) {
		return str;
	}
	return str.slice(0, startCount) + '~' + str.slice(-endCount);
};
