import type { CollectionConfig } from 'payload';

import { revalidateDelete, revalidatePage } from './hooks/revalidatePage';

export const Pages: CollectionConfig = {
	slug: 'pages',
	admin: {
		useAsTitle: 'title',
	},
	versions: {
		drafts: {
			autosave: {
				interval: 100,
			},
		},
	},
	hooks: {
		afterChange: [revalidatePage],
		afterDelete: [revalidateDelete],
	},
	fields: [
		{
			name: 'title',
			type: 'text',
			required: true,
		},
		{
			name: 'slug',
			type: 'text',
			required: true,
			unique: true,
			admin: {
				description: 'URL path (e.g. "about" → /about)',
			},
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
