import type { GlobalConfig } from 'payload';

export const Contact: GlobalConfig = {
	slug: 'contact',
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
			defaultValue: '/contact',
			admin: {
				readOnly: true,
			},
		},
		{
			name: 'contactForm',
			type: 'group',
			fields: [
				{
					name: 'formTitle',
					type: 'text',
				},
				{
					name: 'successMessage',
					type: 'text',
				},
				{
					name: 'errorMessage',
					type: 'text',
				},
				{
					name: 'sendToEmail',
					type: 'email',
				},
				{
					name: 'emailSubject',
					type: 'text',
				},
				{
					name: 'formFailureNotificationEmail',
					type: 'text',
				},
			],
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
