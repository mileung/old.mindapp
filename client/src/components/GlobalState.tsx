import { atom, useAtom } from 'jotai';
import { Note } from './NoteBlock';

export const createAtom = <T,>(initialValue: T) => {
	const atomInstance = atom<T>(initialValue);
	return () => useAtom(atomInstance);
};

export const useUserId = createAtom<null | string>(null);
export const useTags = createAtom<null | string[]>(null);
export const useNotes = createAtom<null | Note[]>(null);
export const useCache = createAtom<Map<any, any>>(new Map());

export const GlobalState = () => {
	return null;
};
