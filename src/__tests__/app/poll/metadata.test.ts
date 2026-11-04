import { generateMetadata } from '@/app/(frontend)/poll/[id]/page';

const mockGetPoll = jest.fn();
jest.mock('@/features/polls/service', () => ({
	getPoll: (...args: any[]) => mockGetPoll(...args),
	getInviteOnlyCreator: jest.fn(),
	getUserPolls: jest.fn(),
}));
jest.mock('@/lib/api/client', () => ({ AuthError: class AuthError extends Error {} }));
jest.mock('@/features/notifications/MarkNotificationRead', () => ({ MarkNotificationRead: () => null }));
jest.mock('@/data/auth', () => ({ getMyProfile: jest.fn(), getUserSession: jest.fn() }));
jest.mock('@/app/(frontend)/poll/[id]/actions', () => ({ switchAccount: jest.fn() }));
jest.mock('@/app/(frontend)/poll/[id]/PollDiscussion', () => ({ PollDiscussion: () => null }));
jest.mock('@/features/polls/sharePreview', () => ({ shareDescription: () => 'description' }));

const metadataFor = (audience?: string) => {
	mockGetPoll.mockResolvedValue({ id: 'p1', title: 'Market night?', audience });
	return generateMetadata({ params: Promise.resolve({ id: 'p1' }) });
};

describe('poll page metadata', () => {
	it('lets search engines index a public poll', async () => {
		expect((await metadataFor('public')).robots).toBeUndefined();
	});

	it.each(['unlisted', 'invite-only'])('keeps a %s poll out of search results', async (audience) => {
		expect((await metadataFor(audience)).robots).toEqual({ index: false });
	});
});
