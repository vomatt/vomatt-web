import { LinkIcon } from '@sanity/icons/Link';
import { defineField, defineType } from 'sanity';

import {
	LinkInput,
	pageDocumentOrder,
} from '@/sanity/schemaTypes/components/LinkInput';

export const linkInput = defineType({
	name: 'linkInput',
	icon: LinkIcon,
	type: 'object',
	fields: [
		defineField({
			name: 'linkType',
			type: 'string',
			options: {
				list: [
					{ title: 'Internal Page', value: 'internal' },
					{ title: 'External URL', value: 'external' },
				],
			},
			initialValue: 'internal',
		}),
		defineField({
			name: 'internalLink',
			title: 'Internal Page',
			type: 'reference',
			to: pageDocumentOrder.map((type) => ({ type })),
			hidden: ({ parent }) => parent?.linkType !== 'internal',
		}),
		defineField({
			name: 'externalUrl',
			title: 'External URL',
			type: 'url',
			hidden: ({ parent }) => parent?.linkType !== 'external',
		}),
	],
	components: {
		input: LinkInput,
	},
});
