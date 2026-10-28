import { sanityFetch } from './live';
import { pageGeneralSlugsQuery } from './queries';

/** Slugs of the published Sanity pages, which share the root with profiles. */
export async function getPageSlugs(): Promise<string[]> {
	const { data } = await sanityFetch({ query: pageGeneralSlugsQuery });
	return ((data ?? []) as { slug: string }[]).map(({ slug }) => slug);
}
