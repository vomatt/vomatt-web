import { defineType } from 'sanity';
export default defineType({
	title: 'Footer Settings',
	name: 'gFooter',
	type: 'document',
	fieldsets: [
		{
			title: 'Block One',
			name: 'footerBlock1',
			description: 'Settings for the first footer block',
			options: { collapsible: true },
		},
		{
			title: 'Block Two',
			name: 'footerBlock2',
			description: 'Settings for the second footer block',
			options: { collapsible: true },
		},
		{
			title: 'Block Three',
			name: 'footerBlock3',
			description: 'Settings for the third footer block',
			options: { collapsible: true },
		},
		{
			title: 'Block Four',
			name: 'footerBlock4',
			description: 'Settings for the fourth footer block',
			options: { collapsible: true },
		},
	],
	fields: [
		{
			title: 'Menu',
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
