import type { QueryParams } from '@sanity/client';

// Published content only, refreshed at most once a minute (no read token or webhook is configured).
export async function sanityFetch({
	query,
	params = {},
}: {
	query: string;
	params?: QueryParams;
}) {
	// Imported lazily so a missing Sanity env var fails this call, not every importer
	const { client } = await import('@/sanity/lib/client');
	const data = await client.fetch(query, params, {
		next: { revalidate: 60 },
	});
	return { data };
}
