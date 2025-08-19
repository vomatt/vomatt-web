import { defineType } from 'sanity';

export default defineType({
	title: 'Footer Settings',
	name: 'gFooter',
	type: 'document',
	fields: [
		{
			name: 'menu',
			type: 'reference',
			to: [{ type: 'settingsMenu' }],
		},
		{
			title: 'Legal menu',
			name: 'menuLegal',
			type: 'reference',
			to: [{ type: 'settingsMenu' }],
		},
	],
	preview: {
		prepare() {
			return {
				title: 'Footer Settings',
			};
		},
	},
});
