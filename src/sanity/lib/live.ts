import type { QueryParams } from '@sanity/client';

import { revalidatesOnPublish } from '@/sanity/env';

/** Tags every sync-tag lookup; /api/revalidate expires it on every publish. */
export const SYNC_TAGS_TAG = 'sanity:sync-tags';

// Next.js drops tags past this many per fetch
const MAX_TAGS = 128;

/**
 * Published content only, cached until a publish changes it.
 * Next.js needs a fetch's tags before it runs, but Sanity returns a query's sync
 * tags with its result, so this fetches twice: a lookup for the sync tags, then
 * the content cached under `sanity:<syncTag>`. On publish, /api/revalidate
 * expires the lookups and only the changed sync tags, so pages whose content
 * didn't change keep their cached content.
 * Outside production nothing expires the cache (the Sanity Function only calls
 * production), so it refreshes every 60s.
 */
export async function sanityFetch({
	query,
	params = {},
}: {
	query: string;
	params?: QueryParams;
}) {
	// Imported lazily so a missing Sanity env var fails this call, not every importer
	const { client } = await import('@/sanity/lib/client');
	// Hourly even when publishes expire it: a fetch in flight during a publish
	// can re-cache the old content after its tags expired
	const revalidate = revalidatesOnPublish() ? 3600 : 60;

	// `tag` changes the request URL, so the lookup and the content get separate cache entries
	const { syncTags = [] } = await client.fetch(query, params, {
		filterResponse: false,
		tag: 'sync-tags',
		next: { revalidate, tags: [SYNC_TAGS_TAG] },
	});

	const tags =
		syncTags.length > 0 && syncTags.length <= MAX_TAGS
			? syncTags.map((tag) => `sanity:${tag}`)
			: // Untrackable: refresh on every publish instead
				[SYNC_TAGS_TAG];

	const data = await client.fetch(query, params, {
		next: { revalidate, tags },
	});
	return { data };
}
