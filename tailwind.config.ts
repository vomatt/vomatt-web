import type { Config } from 'tailwindcss';

const config: Config = {
	content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
	theme: {
		fontFamily: {
			sans: ['Graphik', 'sans-serif'],
			serif: ['Merriweather', 'serif'],
			'chinese-traditional': ['PingFang TC', 'Microsoft JhengHei'],
		},
		extend: {
			colors: {
				black: 'rgba(var(--cr-black), 1)',
				white: 'rgba(var(--cr-white), 1)',
				accent: 'rgba(var(--cr-accent), 1)',
				cream: 'rgba(var(--cr-cream), 1)',
				primary: 'rgba(var(--cr-primary), 1)',
				secondary: 'rgba(var(--cr-secondary), 1)',
				tertiary: 'rgba(var(--cr-tertiary), 1)',
				quaternary: 'rgba(var(--cr-quaternary), 1)',
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
				success: 'rgba(var(--cr-success), 1)',
				warn: 'rgba(var(--cr-warn) ,1)',
				error: 'rgba(var(--cr-error), 1)',
			},
			spacing: {
				contain: 'var(--s-contain)',
				'contain-dynamic': 'var(--s-contain-dynamic)',
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

export default config;
