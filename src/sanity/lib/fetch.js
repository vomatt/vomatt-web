import 'server-only';

import { draftMode } from 'next/headers';

import { client } from '@/sanity/lib/client';
import { pagePaths } from '@/sanity/lib/queries';
import * as queries from '@/sanity/lib/queries';

import { revalidateSecret, token } from './env';

const DEFAULT_PARAMS = {};
const DEFAULT_TAGS = [];

export async function sanityFetch({
	query,
	params = DEFAULT_PARAMS,
	tags = DEFAULT_TAGS,
}) {
	const isPreviewMode = (await draftMode()).isEnabled;

	if (isPreviewMode && !token) {
		throw new Error(
			'The `SANITY_API_READ_TOKEN` environment variable is required.'
		);
	}

	return client.fetch(query, params, {
		// We only cache if there's a revalidation webhook setup
		cache:
			revalidateSecret && process.env.NODE_ENV !== 'development'
				? 'force-cache'
				: 'no-store',
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

export async function getSiteData() {
	const data = sanityFetch({
		query: `{${queries.site}}`,
	});

	return data;
}

const getPageDataStructure = ({ query }) => {
	const data = `{
		"page": ${query},
		${queries.site}
	}`;

	return data;
};

export async function getSignUpInfoData() {
	return sanityFetch({
		query: queries.gSignUpDataQuery,
		tags: [`gSignUp`],
	});
}

export async function getPageHomeData() {
	const query = getPageDataStructure({ query: queries.pageHomeQuery });

	return sanityFetch({
		query,
		tags: [`pHome`],
	});
}

export async function get404PageData() {
	const query = getPageDataStructure({ query: queries.page404Query });

	return sanityFetch({
		query,
		tags: [`p404`],
	});
}

export function getPagesPaths() {
	return client.fetch(pagePaths, {}, { token, perspective: 'published' });
}

export function getPageBySlug(params) {
	const query = getPageDataStructure({ query: queries.pagesBySlugQuery });

	return sanityFetch({
		query,
		params: params,
		tags: [`pGeneral:${params.slug}`],
	});
}

// new pages below...
// export function getAboutPage(params) {
// 	const query = getPageDataStructure({ query: queries.pageAboutQuery });

// 	return sanityFetch({
// 		query,
// 		params: params,
// 		tags: [`pAbout:${params.slug}`],
// 	});
// }
