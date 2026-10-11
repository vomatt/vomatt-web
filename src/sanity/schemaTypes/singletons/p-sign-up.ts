import { defineType } from 'sanity';

import sharing from '@/sanity/schemaTypes/objects/sharing';
import slug from '@/sanity/schemaTypes/objects/slug';
import title from '@/sanity/schemaTypes/objects/title';

export const pSignUp = defineType({
	title: 'Login page',
	name: 'pSignUp',
	type: 'document',
	fields: [
		title({ initialValue: 'Log in' }),
		slug({
			initialValue: { _type: 'slug', current: '/login' },
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
