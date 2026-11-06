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

const POLL_ID = '01a195a4-2a06-7137-a746-2c2ebb8136cc';

const metadataFor = (audience?: string) => {
	mockGetPoll.mockResolvedValue({ id: POLL_ID, title: 'Market night?', audience });
	return generateMetadata({ params: Promise.resolve({ id: POLL_ID }) });
};

describe('poll page metadata', () => {
	it.each(['public', undefined])('lets search engines index a poll with audience %s', async (audience) => {
		expect((await metadataFor(audience)).robots).toBeUndefined();
	});

	it.each(['unlisted', 'invite-only'])('keeps a %s poll out of search results', async (audience) => {
		expect((await metadataFor(audience)).robots).toEqual({ index: false });
	});

	it('names the poll URL as canonical', async () => {
		expect((await metadataFor('public')).alternates).toEqual({ canonical: `/poll/${POLL_ID}` });
	});
});
