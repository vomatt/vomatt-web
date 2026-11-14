import { generateMetadata } from '@/app/(frontend)/poll/[id]/page';

const NOT_FOUND = new Error('NEXT_HTTP_ERROR_FALLBACK;404');
jest.mock('next/navigation', () => ({
	notFound: () => {
		throw NOT_FOUND;
	},
}));

const mockGetPoll = jest.fn();
const mockGetInviteOnlyCreator = jest.fn();
jest.mock('@/features/polls/service', () => ({
	getPoll: (...args: any[]) => mockGetPoll(...args),
	getInviteOnlyCreator: (...args: any[]) => mockGetInviteOnlyCreator(...args),
	getUserPolls: jest.fn(),
}));
jest.mock('@/lib/api/client', () => ({ AuthError: class AuthError extends Error {} }));
jest.mock('@/features/notifications/MarkNotificationRead', () => ({ MarkNotificationRead: () => null }));
jest.mock('@/data/auth', () => ({ getMyProfile: jest.fn(), getUserSession: jest.fn() }));
jest.mock('@/lib/api/services/auth', () => ({ signout: jest.fn() }));
jest.mock('@/app/(frontend)/poll/[id]/PollDiscussion', () => ({ PollDiscussion: () => null }));
jest.mock('@/features/polls/sharePreview', () => ({ shareDescription: () => 'description' }));

const { AuthError } = jest.requireMock('@/lib/api/client');

// Metadata and the page share one lookup, so its outcome decides both.
// Each test uses its own id: the lookup is cached per id
const pollId = (n: number) => `01a195a4-2a06-7137-a746-2c2ebb8136c${n}`;
const lookup = (id: string) => generateMetadata({ params: Promise.resolve({ id }) });

beforeEach(() => {
	mockGetPoll.mockReset();
	mockGetInviteOnlyCreator.mockReset();
});

describe('poll page for a poll that does not open', () => {
	it('shows not-found, not a login prompt, when the poll is missing and is not invite-only', async () => {
		mockGetPoll.mockResolvedValue(null);
		mockGetInviteOnlyCreator.mockResolvedValue(null);
		await expect(lookup(pollId(1))).rejects.toBe(NOT_FOUND);
	});

	it('keeps the invitation for an invite-only poll the viewer cannot open yet', async () => {
		mockGetPoll.mockResolvedValue(null);
		mockGetInviteOnlyCreator.mockResolvedValue({ username: 'alice', avatarUrl: null });
		await expect(lookup(pollId(2))).resolves.toBeTruthy();
	});

	it('keeps the login prompt when the API rejected the session', async () => {
		mockGetPoll.mockRejectedValue(new AuthError());
		await expect(lookup(pollId(3))).resolves.toBeTruthy();
		expect(mockGetInviteOnlyCreator).not.toHaveBeenCalled();
	});

	it('shows not-found for a link whose id is not a poll id, whatever the API answers', async () => {
		// Signed out, the API refuses a malformed id with 401 instead of 404
		mockGetPoll.mockRejectedValue(new Error('unauthorized'));
		await expect(lookup('does-not-exist')).rejects.toBe(NOT_FOUND);
		await expect(lookup(pollId(4).slice(0, -1))).rejects.toBe(NOT_FOUND);
	});
});
