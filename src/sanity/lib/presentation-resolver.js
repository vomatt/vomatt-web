/**
 * Sets up the Presentation Resolver API,
 * see https://www.sanity.io/docs/presentation-resolver-api for more information.
 */
import { defineDocuments, defineLocations } from 'sanity/presentation';

import { resolveHref } from '@/lib/utils';

export const mainDocuments = defineDocuments([
	{
		route: '/',
		filter: `_type == "pHome"`,
	},
	{
		route: '/:slug',
		filter: `_type == "pGeneral" && slug.current == $slug`,
	},
	{
		route: '/blog',
		filter: `_type == "pBlogIndex"`,
	},
	{
		route: '/blog/:slug',
		filter: `_type == "pBlog" && slug.current == $slug`,
	},
	{
		route: '/contact',
		filter: `_type == "pContact"`,
	},
]);

export const locations = {
	pHome: defineLocations({
		message: 'This document is used to render the front page',
		tone: 'positive',
		locations: [
			{ title: 'Home', href: resolveHref({ documentType: 'pHome' }) },
		],
	}),
	settingsGeneral: defineLocations({
		message: 'This document is used on all pages',
		tone: 'positive',
	}),
	pGeneral: defineLocations({
		select: {
			name: 'name',
			slug: 'slug.current',
		},
		resolve: (doc) => ({
			locations: [
				{
					title: doc?.name || 'Untitled',
					href: resolveHref({
						documentType: 'pGeneral',
						slug: doc?.slug,
					}),
				},
			],
		}),
	}),
	pBlog: defineLocations({
		select: { title: 'title', slug: 'slug.current' },
		resolve: (doc) => ({
			locations: [
				{
					title: doc?.title || 'Untitled',
					href: resolveHref({ documentType: 'pBlog', slug: doc?.slug }),
				},
			],
		}),
	}),
};
