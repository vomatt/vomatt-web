import {
	getNotificationPreferences,
	getNotifications,
	getUnreadCount,
	markAllNotificationsRead,
	markNotificationRead,
	updateNotificationPreferences,
} from '@/features/notifications/service';
import { apiClient, ApiError, AuthError } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => {
	class AuthError extends Error {}
	class ApiError extends Error {
		constructor(
			message: string,
			public statusCode: number,
			public data?: any
		) {
			super(message);
		}
	}
	return { apiClient: jest.fn(), ApiError, AuthError };
});

const mockGetPoll = jest.fn();
jest.mock('@/features/polls/service', () => ({ getPoll: (id: string) => mockGetPoll(id) }));
const mockGetUserProfile = jest.fn();
jest.mock('@/lib/api/services/users', () => ({ getUserProfile: (username: string) => mockGetUserProfile(username) }));

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

beforeEach(() => jest.clearAllMocks());

describe('getUnreadCount()', () => {
	it('reads the count', async () => {
		mockApiClient.mockResolvedValue({ count: 3 });
		expect(await getUnreadCount()).toBe(3);
		expect(mockApiClient).toHaveBeenCalledWith('/notifications/unread-count');
	});
});

describe('getUnreadCount() when signed out', () => {
	it('returns null instead of throwing', async () => {
		mockApiClient.mockRejectedValue(new AuthError('expired'));
		expect(await getUnreadCount()).toBeNull();
	});
});

describe('markNotificationRead()', () => {
	it('posts the feed item\'s id to its read endpoint', async () => {
		mockApiClient.mockResolvedValue({ success: true });
		expect(await markNotificationRead('comment_0199')).toBe(true);
		expect(mockApiClient).toHaveBeenCalledWith('/notifications/comment_0199/read', { method: 'POST' });
	});

	it('still takes a poll id, for the poll page', async () => {
		mockApiClient.mockResolvedValue({ success: true });
		await markNotificationRead('poll-1');
		expect(mockApiClient).toHaveBeenCalledWith('/notifications/poll-1/read', { method: 'POST' });
	});

	it('reports a failed request', async () => {
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		mockApiClient.mockRejectedValue(new ApiError('down', 503, { errorCode: 'common.service_unavailable' }));
		expect(await markNotificationRead('comment_0199')).toBe(false);
		spy.mockRestore();
	});

	it('ignores a poll with no notification for the user', async () => {
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		mockApiClient.mockRejectedValue(new ApiError('nf', 404, { errorCode: 'notification.not_found' }));
		await expect(markNotificationRead('poll-1')).resolves.toBe(true);
		expect(spy).not.toHaveBeenCalled();
		spy.mockRestore();
	});

	it('ignores a Deleted poll', async () => {
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		mockApiClient.mockRejectedValue(new ApiError('nf', 404, { errorCode: 'vote.not_found' }));
		await expect(markNotificationRead('poll-1')).resolves.toBe(true);
		expect(spy).not.toHaveBeenCalled();
		spy.mockRestore();
	});
});

const poll = { id: 'p1', title: 'Ramen?', endTime: '2026-10-26T18:00:00+08:00', status: 'ENDED', turnout: 342 };
const rosa = { id: 'u-rosa', username: 'rosa', displayName: 'Rosa', avatarUrl: 'bot:boba' };

describe('getNotifications()', () => {
	it('reads a page and adds what each row needs', async () => {
		const fullPoll = { id: 'p1', title: 'Ramen?' };
		mockGetPoll.mockResolvedValue(fullPoll);
		mockGetUserProfile.mockResolvedValue({ isFollowing: true });
		mockApiClient.mockResolvedValue({
			items: [
				{ id: 'result_p1', kind: 'RESULT', createdAt: '2026-10-26T10:00:00Z', read: false, actor: null, poll, comment: null },
				{ id: 'follow_1', kind: 'FOLLOWED', createdAt: '2026-10-26T09:00:00Z', read: true, actor: rosa, poll: null, comment: null },
				{
					id: 'comment_c1',
					kind: 'COMMENT',
					createdAt: '2026-10-26T08:00:00Z',
					read: false,
					actor: rosa,
					poll,
					comment: { id: 'c1', excerpt: 'Nagi, and it is not close' },
				},
			],
			nextCursor: 'next',
		});

		const page = await getNotifications('cur');

		expect(mockApiClient).toHaveBeenCalledWith('/notifications?limit=20&cursor=cur');
		expect(page.nextCursor).toBe('next');
		expect(page.items.map((item) => item.kind)).toEqual(['RESULT', 'FOLLOWED', 'COMMENT']);
		expect(page.items[0]).toMatchObject({ id: 'result_p1', detail: fullPoll });
		expect(page.items[1]).toMatchObject({ relation: { isFollowing: true, followsYou: true } });
		expect(page.items[2]).toMatchObject({ comment: { id: 'c1' } });
		expect(mockGetPoll).toHaveBeenCalledWith('p1');
		expect(mockGetUserProfile).toHaveBeenCalledWith('rosa');
	});

	it('leaves out a kind it does not know rather than failing the page', async () => {
		mockApiClient.mockResolvedValue({
			items: [
				{ id: 'x_1', kind: 'SOMETHING_NEW', createdAt: '2026-10-26T10:00:00Z', read: false },
				{ id: 'closing_p1', kind: 'CLOSING_SOON', createdAt: '2026-10-26T09:00:00Z', read: false, actor: rosa, poll },
			],
			nextCursor: null,
		});
		const page = await getNotifications();
		expect(page.items.map((item) => item.id)).toEqual(['closing_p1']);
	});

	it('still lists a row whose poll or follower could not be read', async () => {
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		mockGetPoll.mockRejectedValue(new Error('down'));
		mockGetUserProfile.mockRejectedValue(new Error('down'));
		mockApiClient.mockResolvedValue({
			items: [
				{ id: 'invitation_p1', kind: 'INVITATION', createdAt: '2026-10-26T10:00:00Z', read: false, actor: rosa, poll },
				{ id: 'follow_1', kind: 'FOLLOWED', createdAt: '2026-10-26T09:00:00Z', read: false, actor: rosa },
			],
			nextCursor: null,
		});
		const page = await getNotifications();
		expect(page.items[0]).toMatchObject({ detail: null });
		expect(page.items[1]).toMatchObject({ relation: { isFollowing: null } });
		spy.mockRestore();
	});
});

describe('markAllNotificationsRead()', () => {
	it('reads everything with one request', async () => {
		mockApiClient.mockResolvedValue({ success: true });
		expect(await markAllNotificationsRead()).toEqual({ ok: true, data: undefined });
		expect(mockApiClient).toHaveBeenCalledTimes(1);
		expect(mockApiClient).toHaveBeenCalledWith('/notifications/read-all', { method: 'POST' });
	});
});

describe('notification preferences', () => {
	const preferences = { resultsIn: true, invitations: true, comments: true, closingSoon: false };

	it('reads the switches', async () => {
		mockApiClient.mockResolvedValue(preferences);
		expect(await getNotificationPreferences()).toEqual(preferences);
		expect(mockApiClient).toHaveBeenCalledWith('/users/me/notification-preferences');
	});

	it('sends only the switch that changed', async () => {
		mockApiClient.mockResolvedValue({ ...preferences, closingSoon: true });
		const result = await updateNotificationPreferences({ closingSoon: true });
		expect(mockApiClient).toHaveBeenCalledWith('/users/me/notification-preferences', {
			method: 'PATCH',
			body: JSON.stringify({ closingSoon: true }),
		});
		expect(result).toEqual({ ok: true, data: { ...preferences, closingSoon: true } });
	});
});
