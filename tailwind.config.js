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
		fontFamily: {
			sans: ['Graphik', 'sans-serif'],
			serif: ['Merriweather', 'serif'],
			'chinese-traditional': ['PingFang TC', 'Microsoft JhengHei'],
		},
		extend: {
			colors: {
				black: 'var(--cr-black)',
				white: 'var(--cr-white)',
				accent: 'var(--cr-accent)',
				cream: 'var(--cr-cream)',
				primary: 'var(--cr-primary)',
				secondary: 'var(--cr-secondary)',
				tertiary: 'var(--cr-tertiary)',
				quaternary: 'var(--cr-quaternary)',
				gray: {
					50: 'var(--cr-gray-50)',
					100: 'var(--cr-gray-100)',
					200: 'var(--cr-gray-200)',
					300: 'var(--cr-gray-300)',
					400: 'var(--cr-gray-400)',
					500: 'var(--cr-gray-500)',
					600: 'var(--cr-gray-600)',
					700: 'var(--cr-gray-700)',
					800: 'var(--cr-gray-800)',
					900: 'var(--cr-gray-900)',
				},

				success: 'var(--cr-success)',
				warn: 'var(--cr-warn)',
				error: 'var(--cr-error)',
			},
			spacing: {
				contain: 'var(--s-contain)',
			},
			height: {
				18: '4.5rem',
				128: '32rem',
			},
			keyframes: {
				'caret-blink': {
					'0%,70%,100%': { opacity: '1' },
					'20%,50%': { opacity: '0' },
				},
			},
			animation: {
				'caret-blink': 'caret-blink 1.25s ease-out infinite',
			},
		},
	},
	plugins: [],
};
