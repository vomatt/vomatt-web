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
			localized: true,
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
					localized: true,
				},
				{
					name: 'successMessage',
					type: 'text',
					localized: true,
				},
				{
					name: 'errorMessage',
					type: 'text',
					localized: true,
				},
				{
					name: 'sendToEmail',
					type: 'email',
				},
				{
					name: 'emailSubject',
					type: 'text',
					localized: true,
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
