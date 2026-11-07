import { SignedInFeedPage } from '@/app/(frontend)/_components/SignedInFeedPage';

const mockRedirectToLogin = jest.fn();
jest.mock('@/data/auth', () => ({
	getUserSession: async () => null,
	getMyProfile: jest.fn(),
	redirectToLogin: (path: string) => mockRedirectToLogin(path),
}));
jest.mock('@/features/polls/service', () => ({ getPopularTags: jest.fn(), loadFeed: jest.fn() }));
jest.mock('@/app/(frontend)/_components/HomeRail', () => ({ HomeRail: () => null }));
jest.mock('@/app/(frontend)/_components/HomepageHeader', () => ({ HomepageHeader: () => null }));
jest.mock('@/app/(frontend)/_components/PollFeedList', () => ({ PollFeedList: () => null }));

describe('SignedInFeedPage', () => {
	it.each([
		['following', '/following'],
		['resultsIn', '/results-in'],
		['closingSoon', '/closing-soon'],
	] as const)('sends a signed-out visitor of %s to login, back to %s', async (feed, href) => {
		await SignedInFeedPage({ feed });
		expect(mockRedirectToLogin).toHaveBeenCalledWith(href);
	});
});
