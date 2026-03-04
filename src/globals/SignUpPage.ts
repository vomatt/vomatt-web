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
