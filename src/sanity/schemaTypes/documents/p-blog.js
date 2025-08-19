import sharing from '@/sanity/schemaTypes/objects/sharing';
import slug from '@/sanity/schemaTypes/objects/slug';
import title from '@/sanity/schemaTypes/objects/title';
import { BookIcon } from '@sanity/icons';
import { defineType } from 'sanity';

export default defineType({
	title: 'Blog',
	name: 'pBlog',
	type: 'document',
	icon: BookIcon,
	fields: [
		title(),
		slug(),
		{
			name: 'author',
			type: 'reference',
			to: [{ type: 'pBlogAuthor' }],
		},
		{
			name: 'categories',
			type: 'array',
			of: [
				{
					type: 'reference',
					to: { type: 'pBlogCategory' },
				},
			],
			validation: (Rule) => Rule.unique(),
		},
		// {
		// 	name: 'publishDate',
		// 	type: 'date',
		// 	options: {
		// 		dateFormat: 'MM/DD/YY',
		// 		calendarTodayLabel: 'Today',
		// 	},
		// 	validation: (Rule) => Rule.required(),
		// },
		{
			name: 'excerpt',
			title: 'Excerpt',
			type: 'text',
			validation: (Rule) => Rule.required(),
		},
		{
			name: 'content',
			type: 'portableText',
		},
		{
			title: 'Related Articles',
			name: 'relatedBlogs',
			type: 'array',
			description:
				'If left empty, will be pulled 2 articles from the same category',
			of: [
				{
					name: 'articles',
					type: 'reference',
					to: [{ type: 'pBlog' }],
				},
			],
		},
		sharing(),
	],
	preview: {
		select: {
			title: 'title',
			slug: 'slug',
			categories: 'categories.0.title',
		},
		prepare({ title = 'Untitled', slug = {}, categories }) {
			const path = `/blog/${slug?.current}`;
			const categoryTitle = categories ?? '';
			const subtitle = `[${
				categoryTitle ? categoryTitle : '(missing category)'
			}] - ${slug.current ? path : '(missing slug)'}`;

			return {
				title: title,
				subtitle: subtitle,
				media: BookIcon,
			};
		},
	},
});
