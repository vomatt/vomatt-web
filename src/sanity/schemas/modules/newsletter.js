import { EnvelopeIcon } from '@sanity/icons';
import { defineType } from 'sanity';

export default defineType({
	title: 'Newsletter Form',
	name: 'newsletter',
	type: 'object',
	icon: EnvelopeIcon,
	fields: [
		{
			title: 'Klaviyo List ID',
			name: 'klaviyoListID',
			type: 'string',
			description: 'Your Klaviyo List to subscribe emails to',
			validation: (Rule) => Rule.required(),
		},
		{
			title: 'Submit Text',
			name: 'submit',
			type: 'string',
		},
		{
			title: 'Success Message',
			name: 'successMsg',
			type: 'string',
		},
		{
			title: 'Error Message',
			name: 'errorMsg',
			type: 'string',
		},
		{
			title: 'Agreement Statement',
			name: 'terms',
			type: 'string',
		},
	],
	preview: {
		prepare() {
			return {
				title: 'Newsletter Form',
			};
		},
	},
});
