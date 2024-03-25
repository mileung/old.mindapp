import { atom, useAtom } from 'jotai';
import { RootSettings, Workspace } from '../pages/Settings';
import { TagTree } from './tags';

export const createAtom = <T>(initialValue: T) => {
	const atomInstance = atom<T>(initialValue);
	return () => useAtom(atomInstance);
};

export const useSpaceId = createAtom<undefined | null | number>(undefined);
export const usePersona = createAtom<undefined | null | number>(undefined);
export const useTagTree = createAtom<undefined | null | TagTree>(undefined);
export const useRootSettings = createAtom<undefined | null | RootSettings>(undefined);
export const useWorkspace = createAtom<undefined | null | Workspace>(undefined);
export const useLastUsedTags = createAtom<string[]>([]);
