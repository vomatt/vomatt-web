import { defineType } from 'sanity';
export default defineType({
	title: 'SEO + Social Sharing',
	name: 'settingsSharing',
	type: 'document',
	fields: [
		{
			title: 'Site Description',
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
			description: '1200 x 630px in PNG, JPG, or GIF',
			options: {
				accept: '.jpg,.png,.gif',
			},
		},
		{
			title: 'Favicon',
			name: 'favicon',
			type: 'image',
			description: '256 x 256px in PNG',
			options: {
				accept: '.png',
			},
		},
	],
	preview: {
		prepare() {
			return {
				title: 'SEO + Social Sharing',
			};
		},
	},
});
