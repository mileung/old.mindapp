export const isDarkMode = () => document.documentElement.classList.contains('dark');

const darken = () => document.documentElement.classList.add('dark');
const lighten = () => document.documentElement.classList.remove('dark');

export const setTheme = (label: 'system' | 'light' | 'dark') => {
	localStorage.theme = label;
	const systemThemeIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	if (label === 'dark' || systemThemeIsDark) {
		darken();
	} else if (label === 'light' || !systemThemeIsDark) {
		lighten();
	}
};

if (
	!localStorage.theme ||
	!(
		localStorage.theme === 'system' ||
		localStorage.theme === 'light' ||
		localStorage.theme === 'dark'
	)
) {
	localStorage.theme = 'system';
}

setTheme(localStorage.theme);

// does not exist on older browsers
if (window?.matchMedia('(prefers-color-scheme: dark)')?.addEventListener) {
	window?.matchMedia('(prefers-color-scheme: dark)')?.addEventListener('change', (e) => {
		if (localStorage.theme === 'system') {
			e.matches ? darken() : lighten();
		}
	});
}
