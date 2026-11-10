import sitemap from '@/app/sitemap';

const mockGetPolls = jest.fn();
jest.mock('@/features/polls/service', () => ({
	getPolls: (...args: any[]) => mockGetPolls(...args),
}));

const originalSiteUrl = process.env.SITE_URL;
beforeEach(() => {
	process.env.SITE_URL = 'https://vomatt.com';
	mockGetPolls.mockReset();
});
afterAll(() => {
	process.env.SITE_URL = originalSiteUrl;
});

const urls = async () => (await sitemap()).map(({ url }) => url);

describe('sitemap.xml', () => {
	it('lists home, Explore, and the open and ended public polls', async () => {
		mockGetPolls.mockImplementation(async ({ status }) => ({
			items: [{ id: `${status}-1`, startTime: '2026-11-01T00:00:00Z' }],
			nextCursor: null,
		}));
		expect(await urls()).toEqual([
			'https://vomatt.com',
			'https://vomatt.com/explore',
			'https://vomatt.com/poll/open-1',
			'https://vomatt.com/poll/ended-1',
		]);
	});

	it('dates an ended poll from when it ended, and an open one from its last edit', async () => {
		mockGetPolls.mockImplementation(async ({ status }) => ({
			items:
				status === 'open'
					? [{ id: 'o', active: true, votingActive: true, startTime: '2026-11-01T00:00:00Z', updatedAt: '2026-11-02T00:00:00Z', endTime: '2099-01-01T00:00:00Z' }]
					: [{ id: 'e', active: true, votingActive: false, startTime: '2026-10-01T00:00:00Z', updatedAt: null, endTime: '2026-10-10T00:00:00Z' }],
			nextCursor: null,
		}));
		const dates = (await sitemap()).slice(2).map(({ lastModified }) => lastModified);
		expect(dates).toEqual(['2026-11-02T00:00:00Z', '2026-10-10T00:00:00Z']);
	});

	it('still lists the static pages when the poll lists fail', async () => {
		mockGetPolls.mockRejectedValue(new Error('API down'));
		expect(await urls()).toEqual(['https://vomatt.com', 'https://vomatt.com/explore']);
	});
});
