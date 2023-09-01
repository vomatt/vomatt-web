import { defineType } from 'sanity';
export default defineType({
	title: 'Cookie Consent Settings',
	name: 'gCookie',
	type: 'document',
	fields: [
		{
			title: 'Enable Cookie Consent?',
			name: 'enabled',
			type: 'boolean',
		},
		{
			title: 'Message',
			name: 'message',
			type: 'text',
			rows: 2,
			description: 'Your cookie consent message',
			hidden: ({ parent }) => !parent.enabled,
		},
		{
			title: 'Link',
			name: 'link',
			type: 'reference',
			to: [{ type: 'pGeneral' }],
			description: 'Show a link to "Learn More" about your cookie policy',
			hidden: ({ parent }) => !parent.enabled,
		},
	],
	preview: {
		prepare() {
			return {
				title: 'Cookie Consent Settings',
			};
		},
	},
});
