import { defineType } from 'sanity';

export default defineType({
	title: 'General Settings',
	name: 'settingsGeneral',
	type: 'document',
	fields: [
		{
			name: 'siteTitle',
			type: 'string',
			description: 'The name of your site, usually your company/brand name',
		},
		{
			name: 'siteDesc',
			type: 'note',
			description:
				'The meta title and description settings are located in the SEO + sharing section at the bottom of each page',
		},
		{
			name: 'shareGraphic',
			type: 'image',
			description: '1200 x 630px in PNG, JPG, or GIF',
			options: {
				accept: '.jpg,.png,.gif',
			},
		},
		{
			name: 'shareVideo',
			type: 'file',
			description: '1200 x 630px in MP4',
			options: {
				accept: '.mp4',
			},
		},
		{
			name: 'favicon',
			type: 'image',
			description: '256 x 256px in PNG',
			options: {
				accept: '.png',
			},
		},
		{
			name: 'faviconLight',
			type: 'image',
			description:
				'For devices in dark mode, use a light color to create contrast with dark backgrounds.',
			options: {
				accept: '.png',
			},
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
