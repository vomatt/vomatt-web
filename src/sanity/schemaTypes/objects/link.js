import { LinkIcon } from '@sanity/icons';
import { defineField, defineType } from 'sanity';

export const link = defineType({
	name: 'link',
	icon: LinkIcon,
	type: 'object',
	fields: [
		defineField({
			title: ' ',
			name: 'linkInput',
			type: 'linkInput',
			options: {
				collapsible: false,
			},
		}),
		defineField({
			title: 'Open in new tab',
			name: 'isNewTab',
			type: 'boolean',
			initialValue: false,
		}),
	],
});
