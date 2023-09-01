import { defineType } from 'sanity';

export default defineType({
	title: 'SEO + Social Sharing',
	name: 'sharing',
	type: 'object',
	options: {
		collapsible: true,
		collapsed: true,
	},
	fields: [
		{
			title: 'Disable Index',
			name: 'disableIndex',
			type: 'boolean',
			description: 'Instruct search engines not to index or follow this page',
		},
		{
			title: 'Title',
			name: 'metaTitle',
			type: 'string',
			description:
				'Displayed on search engine result pages and browser tabs to indicate the topic of a webpage',
			validation: (Rule) =>
				Rule.max(50).warning(
					'Longer titles may be truncated by search engines'
				),
		},
		{
			title: 'Description',
			name: 'metaDesc',
			type: 'text',
			rows: 3,
			description:
				"A summary of the page's content. Use no more than 160 characters",
			validation: (Rule) =>
				Rule.max(160).warning(
					'Longer descriptions may be truncated by search engines'
				),
		},
		{
			title: 'Share Graphic',
			name: 'shareGraphic',
			type: 'image',
			description: '1200 x 630px',
		},
	],
});
