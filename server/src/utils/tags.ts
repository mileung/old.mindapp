export const makeSetArr = (...arrays: string[][]) => {
	return makeSortedUniqueArr(arrays.flatMap((a) => a));
};

export const makeSortedUniqueArr = (a: string[]) => {
	return [...new Set(a)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
};
