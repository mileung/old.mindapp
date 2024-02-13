import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { buildUrl, pinger } from '../utils/api';
import { Tag } from '../utils/tags';
import { RecThought } from './ThoughtBlock';

export const createAtom = <T,>(initialValue: T) => {
	const atomInstance = atom<T>(initialValue);
	return () => useAtom(atomInstance);
};

export const resultsUse = createAtom<(null | RecThought)[]>([]);
export const spaceIdUse = createAtom<null | number>(null);
export const personaUse = createAtom<null | number>(null);
export const tagsUse = createAtom<null | Tag[]>(null);

export const GlobalState = () => {
	const [, tagsSet] = tagsUse();

	useEffect(() => {
		pinger<Tag[]>(buildUrl('get-tags'))
			.then((data) => tagsSet(data))
			.catch((err) => alert(JSON.stringify(err)));
	}, []);

	return null;
};
