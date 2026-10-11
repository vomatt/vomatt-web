import { BookIcon } from '@sanity/icons';
import { defineType } from 'sanity';

import formBuilder from '@/sanity/schemaTypes/objects/form-builder';
import sharing from '@/sanity/schemaTypes/objects/sharing';
import slug from '@/sanity/schemaTypes/objects/slug';
import title from '@/sanity/schemaTypes/objects/title';

export const pContact = defineType({
	title: 'Contact Page',
	name: 'pContact',
	type: 'document',
	icon: BookIcon,
	fields: [
		title(),
		slug(),
		{
			title: 'Contact Form',
			name: 'contactForm',
			type: 'object',
			fields: [
				{
					name: 'formTitle',
					type: 'string',
				},
				formBuilder(),
				{
					name: 'successMessage',
					type: 'string',
				},
				{
					name: 'errorMessage',
					type: 'string',
				},
				{
					name: 'sendToEmail',
					type: 'string',
				},
				{
					name: 'emailSubject',
					type: 'string',
				},
				{
					title: 'Form Failure Notification Email',
					name: 'formFailureNotificationEmail',
					description:
						'A failure notification is sent when the form fails to submit. The notification includes all information that users have submitted. Use comma to separate emails.',
					type: 'string',
				},
			],
		},
		sharing(),
	],
});
