import carousel from '@/sanity/schemaTypes/objects/carousel';
import freeform from '@/sanity/schemaTypes/objects/freeform';
import marquee from '@/sanity/schemaTypes/objects/marquee';
import sharing from '@/sanity/schemaTypes/objects/sharing';
import slug from '@/sanity/schemaTypes/objects/slug';
import title from '@/sanity/schemaTypes/objects/title';
import { defineType } from 'sanity';

export default defineType({
	title: 'Page',
	name: 'pGeneral',
	type: 'document',
	fields: [
		title(),
		slug(),
		{
			name: 'layout',
			type: 'string',
			options: {
				list: [
					{ title: 'Editor', value: 'editor' },
					{ title: 'Modules', value: 'modules' },
				],
				layout: 'radio',
				direction: 'horizontal',
			},
		},
		{
			name: 'pageModules',
			type: 'array',
			of: [freeform(), carousel(), marquee()],
			hidden: ({ parent }) => parent?.layout !== 'modules',
		},
		{
			name: 'content',
			type: 'portableText',
			hidden: ({ parent }) => parent?.layout !== 'editor',
		},
		sharing(),
	],
	preview: {
		select: {
			title: 'title',
			slug: 'slug',
		},
		prepare({ title = 'Untitled', slug = {} }) {
			return {
				title,
				subtitle: slug.current ? `/${slug.current}` : 'Missing page slug',
			};
		},
	},
});
