const fetchMock = jest.fn();

jest.mock('@/sanity/lib/client', () => ({
	client: { fetch: (...args: unknown[]) => fetchMock(...args) },
}));

import { sanityFetch } from '@/sanity/lib/live';

describe('sanityFetch', () => {
	beforeEach(() => fetchMock.mockReset());

	it('returns the query result wrapped in { data }', async () => {
		fetchMock.mockResolvedValue({ title: 'About' });

		await expect(sanityFetch({ query: '*[0]' })).resolves.toEqual({
			data: { title: 'About' },
		});
	});

	it('passes params and a 60s revalidate to the client', async () => {
		fetchMock.mockResolvedValue(null);

		await sanityFetch({ query: '*[slug == $slug]', params: { slug: 'about' } });

		expect(fetchMock).toHaveBeenCalledWith(
			'*[slug == $slug]',
			{ slug: 'about' },
			{ next: { revalidate: 60 } }
		);
	});

	it('rejects when the client fails', async () => {
		fetchMock.mockRejectedValue(new Error('network'));

		await expect(sanityFetch({ query: '*' })).rejects.toThrow('network');
	});
});
