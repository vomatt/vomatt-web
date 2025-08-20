import carousel from '@/sanity/schemaTypes/objects/carousel';
import freeform from '@/sanity/schemaTypes/objects/freeform';
import marquee from '@/sanity/schemaTypes/objects/marquee';
import sharing from '@/sanity/schemaTypes/objects/sharing';
import slug from '@/sanity/schemaTypes/objects/slug';
import title from '@/sanity/schemaTypes/objects/title';
import { defineType } from 'sanity';

export default defineType({
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
