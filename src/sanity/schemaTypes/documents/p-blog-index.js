import { BookIcon } from '@sanity/icons';
import { defineType } from 'sanity';

import sharing from '@/sanity/schemaTypes/objects/sharing';
import slug from '@/sanity/schemaTypes/objects/slug';
import title from '@/sanity/schemaTypes/objects/title';

export const pBlogIndex = defineType({
	title: 'Blogs',
	name: 'pBlogIndex',
	type: 'document',
	icon: BookIcon,
	fields: [
		title(),
		slug({
			initialValue: { _type: 'slug', current: 'blog' },
			readOnly: true,
		}),
		{
			name: 'itemsPerPage',
			type: 'number',
			validation: (rule) => rule.min(4).required(),
			initialValue: 4,
		},
		{
			name: 'paginationMethod',
			type: 'string',
			options: {
				list: [
					{ title: 'Page numbers', value: 'page-numbers' },
					{ title: 'Load more', value: 'load-more' },
					{
						title: 'Infinite scroll without load more button',
						value: 'infinite-scroll',
					},
				],
				layout: 'radio',
			},
			initialValue: 'page-numbers',
		},
		{
			name: 'loadMoreButtonLabel',
			title: 'Load more label',
			type: 'string',
			hidden: ({ parent }) => parent.paginationMethod !== 'load-more',
		},
		{
			name: 'infiniteScrollCompleteLabel',
			title: 'No more items to load message',
			type: 'string',
			hidden: ({ parent }) => parent.paginationMethod !== 'load-more',
		},
		sharing(),
	],
	preview: {
		select: {
			title: 'title',
		},
		prepare({ title = 'Untitled' }) {
			return {
				title: title,
			};
		},
	},
});
