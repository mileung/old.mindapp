import { atom, useAtom } from 'jotai';
import { TagTree } from './tags';
import { Personas, RootSettings, WorkingDirectory } from './settings';
import { Thought } from './thought';

type LocalState = {
	theme: RootSettings['theme'];
	activePersonaId: string;
	activeSpaceId: string;
};

export const getLocalState = (): LocalState => {
	const storedLocalState = localStorage.getItem('LocalState');
	return storedLocalState
		? JSON.parse(storedLocalState)
		: ({
				theme: 'System',
				activePersonaId: '',
				activeSpaceId: '',
			} as LocalState);
};

export const updateLocalState = (stateUpdate: Partial<LocalState>) => {
	const currentLocalState = getLocalState();
	const mergedState = { ...currentLocalState, ...stateUpdate };
	localStorage.setItem('LocalState', JSON.stringify(mergedState));
	return mergedState;
};

export const createAtom = <T>(initialValue: T) => {
	const atomInstance = atom<T>(initialValue);
	return () => useAtom(atomInstance);
};

export const usePersonas = createAtom<null | Personas>(null);
export const useDefaultNames = createAtom<Record<string, string>>({});
export const useMentionedThoughts = createAtom<Record<string, Thought>>({});
export const useTagTree = createAtom<null | TagTree>(null);
export const useRootSettings = createAtom<null | RootSettings>(null);
export const useWorkingDirectory = createAtom<undefined | null | WorkingDirectory>(undefined);
export const useLastUsedTags = createAtom<string[]>([]);
const _useLocalState = createAtom<LocalState>(getLocalState());
export const useLocalState = () => {
	const [localState, localStateSet] = _useLocalState();
	return [
		localState,
		(newLocalState: typeof localState) => {
			updateLocalState(newLocalState);
			localStateSet(newLocalState);
		},
	] as const;
};

export function useActivePersona() {
	const [localState] = useLocalState();
	const [personas] = usePersonas();
	return personas?.find((p) => p.id === localState.activePersonaId && !p.locked) || null;
}

export function useActiveSpace() {
	const [localState] = useLocalState();
	const persona = useActivePersona();
	return persona?.spaces?.find((p) => p.id === localState.activeSpaceId) || null;
}
