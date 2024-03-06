import { useState } from 'react';
import { Settings } from '../pages/Settings';

type LocalState = {
	theme: Settings['theme'];
};

export const getLocalState = (): LocalState => {
	const storedLocalState = localStorage.getItem('LocalState');
	return storedLocalState
		? JSON.parse(storedLocalState)
		: {
				theme: 'System',
			};
};

export const useLocalState = (): [LocalState, (newState: Partial<LocalState>) => void] => {
	const [state, setState] = useState<LocalState>(getLocalState);

	const updateState = (newState: Partial<LocalState>) => {
		const mergedState = { ...state, ...newState };
		localStorage.setItem('LocalState', JSON.stringify(mergedState));
		setState(mergedState);
	};

	return [state, updateState];
};

export const updateLocalState = (newState: Partial<LocalState>): void => {
	const currentLocalState = getLocalState();
	const mergedState = { ...currentLocalState, ...newState };
	localStorage.setItem('LocalState', JSON.stringify(mergedState));
};
