import { defineType } from 'sanity';
export default defineType({
	title: 'General Settings',
	name: 'settingsGeneral',
	type: 'document',
	fields: [
		{
			title: 'Site Title',
			name: 'siteTitle',
			type: 'string',
			description: 'The name of your site, usually your company/brand name',
		},
		{
			title: 'Home Page',
			name: 'home',
			type: 'reference',
			to: [{ type: 'pGeneral' }],
		},
	],
	preview: {
		prepare() {
			return {
				title: 'General Settings',
			};
		},
	},
});
