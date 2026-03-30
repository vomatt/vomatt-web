import type { GlobalConfig } from 'payload';

export const Home: GlobalConfig = {
	slug: 'home',
	admin: {
		group: 'Pages',
	},
	fields: [
		{
			name: 'title',
			type: 'text',
			defaultValue: 'Homepage',
			localized: true,
		},
		{
			name: 'content',
			type: 'richText',
			localized: true,
		},
		{
			name: 'meta',
			type: 'group',
			fields: [
				{
					name: 'metaTitle',
					type: 'text',
					localized: true,
				},
				{
					name: 'metaDescription',
					type: 'text',
					localized: true,
				},
				{
					name: 'shareImage',
					type: 'upload',
					relationTo: 'media',
				},
			],
		},
	],
};
