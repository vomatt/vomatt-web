/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',

		// Or if using `src` directory:
		'./src/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		colors: {
			black: 'var(--cr-black)',
			white: 'var(--cr-white)',
			accent: 'var(--cr-accent)',
			cream: 'var(--cr-cream)',
			primary: 'var(--cr-primary)',
			secondary: 'var(--cr-secondary)',
			tertiary: 'var(--cr-tertiary)',
			quaternary: 'var(--cr-quaternary)',
			grey: {
				50: 'var(--cr-grey-50)',
				100: 'var(--cr-grey-100)',
				200: 'var(--cr-grey-200)',
				300: 'var(--cr-grey-300)',
				400: 'var(--cr-grey-400)',
				500: 'var(--cr-grey-500)',
				600: 'var(--cr-grey-600)',
				700: 'var(--cr-grey-700)',
				800: 'var(--cr-grey-800)',
				900: 'var(--cr-grey-900)',
			},

			success: 'var(--cr-success)',
			warn: 'var(--cr-warn)',
			error: 'var(--cr-error)',
		},
		fontFamily: {
			sans: ['Graphik', 'sans-serif'],
			serif: ['Merriweather', 'serif'],
			'chinese-traditional': ['PingFang TC', 'Microsoft JhengHei'],
		},
		extend: {
			spacing: {
				contain: 'var(--s-contain)',
			},
		},
	},
	plugins: [],
};
