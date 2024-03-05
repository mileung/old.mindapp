import { atom, useAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { buildUrl, ping } from '../utils/api';
import { TagTree } from '../utils/tags';
import { Settings } from '../pages/Settings';
import { setTheme } from '../utils/theme';

export const createAtom = <T,>(initialValue: T) => {
	const atomInstance = atom<T>(initialValue);
	return () => useAtom(atomInstance);
};

export const useSpaceId = createAtom<null | number>(null);
export const usePersona = createAtom<null | number>(null);
export const useTagTree = createAtom<null | TagTree>(null);
export const useSettings = createAtom<null | Settings>(null);

export const GlobalState = () => {
	const [, tagTreeSet] = useTagTree();
	const [settings, settingsSet] = useSettings();
	const themeModeRef = useRef('');

	useEffect(() => {
		ping<TagTree>(buildUrl('get-tag-tree'))
			.then((data) => tagTreeSet(data))
			.catch((err) => alert(JSON.stringify(err)));
		ping<Settings>(buildUrl('get-settings'))
			.then((data) => settingsSet(data))
			.catch((err) => alert(JSON.stringify(err)));

		// does not exist on older browsers
		if (window?.matchMedia('(prefers-color-scheme: dark)')?.addEventListener) {
			window?.matchMedia('(prefers-color-scheme: dark)')?.addEventListener('change', () => {
				setTheme(themeModeRef.current);
			});
		}
	}, []);

	useEffect(() => {
		if (settings) {
			themeModeRef.current = settings.themeMode;
			setTheme(settings.themeMode);
		}
	}, [settings]);

	return null;
};
