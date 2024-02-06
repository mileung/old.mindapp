export const makeSetArr = (a: string[], b: string[], exclude?: string) => {
	return [...new Set(a.concat(b))].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
};
