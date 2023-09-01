import 'server-only';

import { draftMode } from 'next/headers';

import { client } from '@/sanity/lib/client';
import { pagePaths, pagesBySlugQuery } from '@/sanity/lib/queries';
import * as queries from '@/sanity/lib/queries';

import { revalidateSecret } from '../env';

export const token = process.env.SANITY_API_READ_TOKEN;
const DEFAULT_PARAMS = {};
const DEFAULT_TAGS = [];

export async function sanityFetch({
	query,
	params = DEFAULT_PARAMS,
	tags = DEFAULT_TAGS,
}) {
	// const isPreviewMode = draftMode().isEnabled;
	const isPreviewMode = false;
	if (isPreviewMode && !token) {
		throw new Error(
			'The `SANITY_API_READ_TOKEN` environment variable is required.'
		);
	}

	// @TODO this won't be necessary after https://github.com/sanity-io/client/pull/299 lands
	const sanityClient =
		client.config().useCdn && isPreviewMode
			? client.withConfig({ useCdn: false })
			: client;

	return sanityClient.fetch(query, params, {
		// We only cache if there's a revalidation webhook setup
		cache: revalidateSecret ? 'force-cache' : 'no-store',
		...(isPreviewMode && {
			cache: undefined,
			token: token,
			perspective: 'previewDrafts',
		}),
		next: {
			...(isPreviewMode && {
				revalidate: process.env.NEXT_PUBLIC_REVALIDATE_TIME,
			}),
			tags,
		},
	});
}

export function getPagesPaths() {
	return client.fetch(pagePaths, {}, { token, perspective: 'published' });
}

export function getPageBySlug(slug) {
	return sanityFetch({
		query: pagesBySlugQuery,
		params: { slug },
		tags: [`page:${slug}`],
	});
}

export function getHomePageData() {
	const homePageQuery = `
		*[_type == "pGeneral" && _id == ${queries.homeID}] | order(_updatedAt desc)[0]{
			title,
			"slug": slug.current,
			sharing,
			"isHomepage": true,
			modules[]{
				${queries.modules}
			},
		}
	`;
	const query = `{
			"page": ${homePageQuery},
			${queries.site}
		}`;

	return sanityFetch({
		query,
		tags: ['home'],
	});
}

export async function getSiteData() {
	const query = `{${queries.site}}`;
	const data = sanityFetch({
		query,
		tags: ['home'],
	});

	return data;
}

export async function get404PageData(preview) {
	const pageQueryData = `*[_type == "page404" && _id == "page404"] | order(_updatedAt desc)[0]{
			heading,
			"slug": "404",
			sharing,
			paragraph[]{
				${queries.portableTextContent}
			},
			callToAction{
				${queries.callToAction}
			}
		}`;

	const query = `
		{
			"page": ${pageQueryData},
			${queries.site}
		}
	`;

	return sanityFetch({
		query,
	});
}
