import type { GlobalConfig } from 'payload';

export const SignUpPage: GlobalConfig = {
	slug: 'sign-up-page',
	admin: {
		group: 'Pages',
	},
	fields: [
		{
			name: 'title',
			type: 'text',
			localized: true,
		},
		{
			name: 'slug',
			type: 'text',
			defaultValue: '/signup',
			admin: {
				readOnly: true,
			},
		},
		{
			name: 'policyMessage',
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
