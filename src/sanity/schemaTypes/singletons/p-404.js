import callToAction from '@/sanity/schemaTypes/objects/call-to-action';
import { UnknownIcon } from '@sanity/icons';
import { defineType } from 'sanity';

export const p404 = defineType({
	title: 'Page 404',
	name: 'p404',
	type: 'document',
	icon: UnknownIcon,
	fields: [
		{
			title: 'Heading',
			name: 'heading',
			type: 'string',
		},
		{
			title: 'Paragraph',
			name: 'paragraph',
			type: 'portableTextSimple',
		},
		callToAction(),
	],
});
