import { TagsIcon } from '@sanity/icons';
import { defineType } from 'sanity';

import sharing from '@/sanity/schemaTypes/objects/sharing';
import slug from '@/sanity/schemaTypes/objects/slug';
import title from '@/sanity/schemaTypes/objects/title';

export const pBlogCategory = defineType({
	title: 'Categories',
	name: 'pBlogCategory',
	type: 'document',
	icon: TagsIcon,
	fields: [
		title(),
		slug(),
		{
			title: 'Category Color',
			name: 'categoryColor',
			type: 'reference',
			to: [{ type: 'settingsBrandColors' }],
		},
		sharing(),
	],
	preview: {
		select: {
			title: 'title',
		},
		prepare: ({ title }) => ({
			title,
		}),
	},
});
