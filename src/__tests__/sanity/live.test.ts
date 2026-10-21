const fetchMock = jest.fn();

jest.mock('@/sanity/lib/client', () => ({
	client: { fetch: (...args: unknown[]) => fetchMock(...args) },
}));

import { sanityFetch, SYNC_TAGS_TAG } from '@/sanity/lib/live';

/** First call: the sync-tag lookup. Second call: the content, tagged with them. */
function respond(syncTags: string[] | undefined, result: unknown) {
	fetchMock
		.mockResolvedValueOnce({ result, syncTags })
		.mockResolvedValueOnce(result);
}

describe('sanityFetch', () => {
	const original = { ...process.env };

	beforeEach(() => {
		fetchMock.mockReset();
		process.env.SANITY_REVALIDATE_SECRET = 'secret';
		process.env.VERCEL_ENV = 'production';
	});

	afterAll(() => {
		process.env = original;
	});

	it('returns the query result wrapped in { data }', async () => {
		respond(['s1:a'], { title: 'About' });

		await expect(sanityFetch({ query: '*[0]' })).resolves.toEqual({
			data: { title: 'About' },
		});
	});

	it('looks up the sync tags under the shared lookup tag, refreshed hourly as a fallback', async () => {
		respond(['s1:a'], null);

		await sanityFetch({ query: '*[slug == $slug]', params: { slug: 'about' } });

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			'*[slug == $slug]',
			{ slug: 'about' },
			{
				filterResponse: false,
				tag: 'sync-tags',
				next: { revalidate: 3600, tags: [SYNC_TAGS_TAG] },
			}
		);
	});

	it('caches the content under its own sync tags, refreshed hourly as a fallback', async () => {
		respond(['s1:a', 's1:b'], null);

		await sanityFetch({ query: '*[slug == $slug]', params: { slug: 'about' } });

		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			'*[slug == $slug]',
			{ slug: 'about' },
			{ next: { revalidate: 3600, tags: ['sanity:s1:a', 'sanity:s1:b'] } }
		);
	});

	it('falls back to the lookup tag when Sanity returns no sync tags', async () => {
		respond(undefined, null);

		await sanityFetch({ query: '*' });

		expect(fetchMock.mock.calls[1][2]).toEqual({
			next: { revalidate: 3600, tags: [SYNC_TAGS_TAG] },
		});
	});

	it('falls back to the lookup tag when there are more sync tags than Next can store', async () => {
		respond(
			Array.from({ length: 129 }, (_, i) => `s1:${i}`),
			null
		);

		await sanityFetch({ query: '*' });

		expect(fetchMock.mock.calls[1][2]).toEqual({
			next: { revalidate: 3600, tags: [SYNC_TAGS_TAG] },
		});
	});

	it('refreshes every 60s when no secret is set, since nothing can expire the cache', async () => {
		delete process.env.SANITY_REVALIDATE_SECRET;
		respond(['s1:a'], null);

		await sanityFetch({ query: '*' });

		expect(fetchMock.mock.calls[0][2].next.revalidate).toBe(60);
		expect(fetchMock.mock.calls[1][2].next.revalidate).toBe(60);
	});

	it('refreshes every 60s outside production, which the Sanity Function never calls', async () => {
		process.env.VERCEL_ENV = 'preview';
		respond(['s1:a'], null);

		await sanityFetch({ query: '*' });

		expect(fetchMock.mock.calls[0][2].next.revalidate).toBe(60);
		expect(fetchMock.mock.calls[1][2].next.revalidate).toBe(60);
	});

	it('rejects when the client fails', async () => {
		fetchMock.mockRejectedValue(new Error('network'));

		await expect(sanityFetch({ query: '*' })).rejects.toThrow('network');
	});
});
