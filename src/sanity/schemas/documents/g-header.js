import { defineType } from 'sanity';
export default defineType({
	title: 'Header Settings',
	name: 'gHeader',
	type: 'document',
	fieldsets: [
		{
			title: 'Desktop',
			name: 'desktop',
			options: { collapsed: false },
		},
	],
	fields: [
		{
			title: 'Menu',
			name: 'menu',
			type: 'reference',
			to: [{ type: 'settingsMenu' }],
		},
	],
	preview: {
		prepare() {
			return {
				title: 'Header Settings',
			};
		},
	},
});
