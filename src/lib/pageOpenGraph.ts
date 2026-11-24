import type { Metadata, ResolvingMetadata } from 'next';

type OpenGraph = NonNullable<Metadata['openGraph']>;

/**
 * A page's Open Graph tags with its own `og:url`. A page that sets `openGraph` replaces the
 * layout's whole object, so the layout's tags are carried over, all but the ones each page owns.
 */
export async function pageOpenGraph(parent: ResolvingMetadata, page: OpenGraph & { url: string }): Promise<OpenGraph> {
	const { title: _title, description: _description, url: _url, ...site } = (await parent).openGraph ?? {};
	return { ...site, ...page } as OpenGraph;
}
