export const isDarkMode = () => document.documentElement.classList.contains('dark');

export const setTheme = (theme: string) => {
	localStorage.theme = theme;
	const systemTheme = theme === 'System';
	const systemThemeIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	if (theme === 'Dark' || (systemTheme && systemThemeIsDark)) {
		document.documentElement.classList.add('dark');
	} else if (theme === 'Light' || (systemTheme && !systemThemeIsDark)) {
		document.documentElement.classList.remove('dark');
	}
};

setTheme(localStorage.theme);
