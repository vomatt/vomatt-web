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
		},
		{
			name: 'content',
			type: 'richText',
		},
		{
			name: 'meta',
			type: 'group',
			fields: [
				{
					name: 'metaTitle',
					type: 'text',
				},
				{
					name: 'metaDescription',
					type: 'text',
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
