import { LinkIcon } from '@sanity/icons';
import { defineType } from 'sanity';
import { LinkInput } from '@/sanity/component/LinkInput';

export default defineType({
	title: 'Link',
	name: 'link',
	icon: LinkIcon,
	type: 'object',
	fields: [
		{
			type: 'string',
			title: 'URL',
			name: 'route',
			components: {
				input: LinkInput,
			},
		},
		{
			title: 'Open in new tab',
			name: 'isNewTab',
			type: 'boolean',
			initialValue: false,
		},
	],
});
