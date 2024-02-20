export const isDarkMode = () => document.documentElement.classList.contains('dark');

export const setTheme = (label: string) => {
	localStorage.theme = label;
	const systemTheme = label === 'System';
	const systemThemeIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	if (label === 'Dark' || (systemTheme && systemThemeIsDark)) {
		document.documentElement.classList.add('dark');
	} else if (label === 'Light' || (systemTheme && !systemThemeIsDark)) {
		document.documentElement.classList.remove('dark');
	}
};

setTheme(localStorage.theme);
