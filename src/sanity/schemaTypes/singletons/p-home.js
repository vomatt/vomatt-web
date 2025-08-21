import carousel from '@/sanity/schemaTypes/objects/carousel';
import freeform from '@/sanity/schemaTypes/objects/freeform';
import marquee from '@/sanity/schemaTypes/objects/marquee';
import sharing from '@/sanity/schemaTypes/objects/sharing';
import slug from '@/sanity/schemaTypes/objects/slug';
import title from '@/sanity/schemaTypes/objects/title';
import { defineType } from 'sanity';

export const pHome = defineType({
	title: 'Homepage',
	name: 'pHome',
	type: 'document',
	fields: [
		title({ initialValue: 'Homepage' }),
		slug({ initialValue: { _type: 'slug', current: '/' }, readOnly: true }),
		{
			title: 'Page Modules',
			name: 'pageModules',
			type: 'array',
			of: [freeform(), carousel(), marquee()],
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
