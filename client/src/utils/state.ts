import { atom, useAtom } from 'jotai';
import { useCallback } from 'react';
import { Persona } from '../types/PersonasPolyfill';
import { Thought } from './ClientThought';
import { hostedLocally, localApiHost, ping, post } from './api';
import { createKeyPair, signItem } from './security';
import { RootSettings, Space, WorkingDirectory } from './settings';
import { TagTree } from './tags';

export type LocalState = {
	theme: 'System' | 'Light' | 'Dark';
	personas: Persona[];
	fetchedSpaces: Record<string, Space>;
};

export const defaultSpaceHost = hostedLocally ? localApiHost : 'TODO: default global space';

export const getLocalState = () => {
	const storedLocalState = localStorage.getItem('LocalState');
	const localState: LocalState = storedLocalState ? JSON.parse(storedLocalState) : {};
	const validLocalState = true; // use ajv
	// const validLocalState = // TODO: make a nicer way of normalizing the local state
	// 	['System', 'Light', 'Dark'].includes(localState.theme) &&
	// 	Array.isArray(localState.personas) &&
	// 	localState.personas.every((p) => {
	// 		return (
	// 			typeof p.id === 'string' &&
	// 			['string', 'undefined'].includes(typeof p.name) &&
	// 			(typeof p.locked === 'undefined' || p.locked === true) &&
	// 			Array.isArray(p.spaceHosts) &&
	// 			p.spaceHosts.length &&
	// 			p.spaceHosts.every((id) => typeof id === 'string')
	// 		);
	// 	}) &&
	// 	isRecord(localState.fetchedSpaces);
	// TODO: validate localState.fetchedSpaces. I may need to use ajv client side but prefer not to...

	return validLocalState
		? localState
		: ({
				theme: 'System',
				personas: [{ id: '', spaceHosts: [defaultSpaceHost] }],
				fetchedSpaces: {},
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

const currentLocalState = getLocalState();
export const usePersonas = createAtom<Persona[]>(currentLocalState.personas);
export const useFetchedSpaces = createAtom<Record<string, Space>>(currentLocalState.fetchedSpaces);
export const useSavedFileThoughtIds = createAtom<Record<string, boolean>>({});
export const useNames = createAtom<Record<string, string>>({});
export const useMentionedThoughts = createAtom<Record<string, Thought>>({});
export const useRootSettings = createAtom<null | RootSettings>(null);
export const useWorkingDirectory = createAtom<undefined | null | WorkingDirectory>(undefined);
export const useLastUsedTags = createAtom<string[]>([]);
export const useLocalState = createAtom<LocalState>(currentLocalState);
export const useTagTree = createAtom<null | TagTree>(
	hostedLocally
		? null
		: {
				parents: {},
				loners: [],
			},
);

type Item = string | Record<string, any> | any[];
export function useGetSignature() {
	const [personas] = usePersonas();
	return useCallback(
		(item: Item, personaId?: string) => {
			// console.log(item, personaId);
			if (!personaId) return;
			const persona = personas.find((p) => p.id === personaId);
			if (!persona) throw new Error('Persona not found');
			const locked = !persona.mnemonic;
			if (locked) throw new Error('Persona locked');
			const { publicKey, privateKey } = createKeyPair(persona.mnemonic);
			if (publicKey !== personaId) {
				throw new Error('Mnemonic on file does not correspond to personaId');
			}
			return signItem(item, privateKey);
		},
		[personas],
	);
}

type Message = {
	[key: string]: any;
	to: string;
	from?: string;
};
export function useSendMessage() {
	const getSignature = useGetSignature();
	return useCallback(
		async <T>(message: Message) => {
			return await ping<T>(
				message.to,
				post({ message, fromSignature: getSignature(message, message.from) }),
			);
		},
		[getSignature],
	);
}

export function useActiveSpace() {
	const [personas] = usePersonas();
	const [spaces] = useFetchedSpaces();
	return spaces[personas[0].spaceHosts[0]] || { host: personas[0].spaceHosts[0] };
}
