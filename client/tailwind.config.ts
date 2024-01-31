import type { Config } from 'tailwindcss';

const config: Config = {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				clear: 'var(--clear)',
				bg0: 'var(--bg0)',
				bg1: 'var(--bg1)',
				bg2: 'var(--bg2)',
				bg3: 'var(--bg3)',
				cell1: 'var(--cell1)',
				cell2: 'var(--cell2)',
				cell3: 'var(--cell3)',
				mg1: 'var(--mg1)',
				mg2: 'var(--mg2)',
				fg1: 'var(--fg1)',
				fg2: 'var(--fg2)',
				input: 'var(--input)',
				'app-fade': 'var(--app-fade)',
				'logos-fl': 'var(--logos-fl)',
				'logos-fr': 'var(--logos-fr)',
			},
		},
	},
	// plugins: {
	// 	'postcss-import': {},
	// 	'tailwindcss/nesting': {},
	// 	tailwindcss: {},
	// 	autoprefixer: {},
	// },
};

export default config;
