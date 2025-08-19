import { defineType, defineField } from 'sanity';
import { LinkIcon } from '@sanity/icons';

export default defineType({
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
