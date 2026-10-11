import { defineType } from 'sanity';

import sharing from '@/sanity/schemaTypes/objects/sharing';
import slug from '@/sanity/schemaTypes/objects/slug';
import title from '@/sanity/schemaTypes/objects/title';

export const pSignUp = defineType({
	title: 'Sign up page',
	name: 'pSignUp',
	type: 'document',
	fields: [
		title({ initialValue: 'Sign up' }),
		slug({
			initialValue: { _type: 'slug', current: '/signup' },
			readOnly: true,
		}),
		{
			name: 'policyMessage',
			type: 'portableTextSimple',
		},
		sharing(),
	],
	preview: {
		select: {
			title: 'title',
		},
		prepare({ title = 'Untitled' }) {
			return {
				title,
			};
		},
	},
});
