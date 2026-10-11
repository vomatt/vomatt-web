import { defineType } from 'sanity';

export const settingsGeneral = defineType({
	title: 'General Settings',
	name: 'settingsGeneral',
	type: 'document',
	fields: [
		{
			name: 'comingSoon',
			title: 'Coming soon',
			type: 'object',
			description:
				'While on, the live site shows only this page. Turn it off to launch. Local development always shows the full site.',
			options: { collapsible: true, collapsed: false },
			fields: [
				{
					name: 'enabled',
					title: 'Show coming soon page',
					type: 'boolean',
					initialValue: true,
				},
				{
					name: 'heading',
					type: 'string',
					initialValue: 'Coming soon',
				},
				{
					name: 'message',
					type: 'portableTextSimple',
					description: 'Optional text under the heading, e.g. a launch date or a link',
				},
			],
		},
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
