import { defineType } from 'sanity';

export default defineType({
	title: 'Page',
	name: 'pHome',
	type: 'document',
	fields: [
		{
			title: 'Page Modules',
			name: 'pageModules',
			type: 'array',
			of: [{ type: 'freeform' }, { type: 'carousel' }, { type: 'marquee' }],
		},
		{
			title: 'SEO + Share Settings',
			name: 'sharing',
			type: 'sharing',
		},
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
