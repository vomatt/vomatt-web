import { defineType } from 'sanity';

export const gHeader = defineType({
	title: 'Header Settings',
	name: 'gHeader',
	type: 'document',
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
