import { RootSettings } from './settings';
import { getLocalState, updateLocalState } from './state';

export const isDarkMode = () => document.documentElement.classList.contains('dark');

export const setTheme = (theme: RootSettings['theme']) => {
	updateLocalState({ theme });
	const systemTheme = theme === 'System';
	const systemThemeIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	if (theme === 'Dark' || (systemTheme && systemThemeIsDark)) {
		document.documentElement.classList.add('dark');
	} else if (theme === 'Light' || (systemTheme && !systemThemeIsDark)) {
		document.documentElement.classList.remove('dark');
	}
};

setTheme(getLocalState().theme);
