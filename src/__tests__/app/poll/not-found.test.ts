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
jest.mock('@/app/(frontend)/poll/[id]/actions', () => ({ switchAccount: jest.fn() }));
jest.mock('@/app/(frontend)/poll/[id]/PollDiscussion', () => ({ PollDiscussion: () => null }));
jest.mock('@/features/polls/sharePreview', () => ({ shareDescription: () => 'description' }));

const { AuthError } = jest.requireMock('@/lib/api/client');

// Metadata and the page share one lookup, so its outcome decides both.
// Each test uses its own id: the lookup is cached per id
const lookup = (id: string) => generateMetadata({ params: Promise.resolve({ id }) });

beforeEach(() => {
	mockGetPoll.mockReset();
	mockGetInviteOnlyCreator.mockReset();
});

describe('poll page for a poll that does not open', () => {
	it('shows not-found, not a login prompt, when the poll is missing and is not invite-only', async () => {
		mockGetPoll.mockResolvedValue(null);
		mockGetInviteOnlyCreator.mockResolvedValue(null);
		await expect(lookup('gone')).rejects.toBe(NOT_FOUND);
	});

	it('keeps the invitation for an invite-only poll the viewer cannot open yet', async () => {
		mockGetPoll.mockResolvedValue(null);
		mockGetInviteOnlyCreator.mockResolvedValue({ username: 'alice', avatarUrl: null });
		await expect(lookup('invited')).resolves.toBeTruthy();
	});

	it('keeps the login prompt when the API rejected the session', async () => {
		mockGetPoll.mockRejectedValue(new AuthError());
		await expect(lookup('expired')).resolves.toBeTruthy();
		expect(mockGetInviteOnlyCreator).not.toHaveBeenCalled();
	});
});
