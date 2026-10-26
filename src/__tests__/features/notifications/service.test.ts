import {
	getNotificationPreferences,
	getNotifications,
	getUnreadCount,
	markAllNotificationsRead,
	markNotificationRead,
	updateNotificationPreferences,
} from '@/features/notifications/service';
import { apiClient, ApiError, AuthError } from '@/lib/api/client';

jest.mock('@/lib/api/auth', () => ({ clearAuthTokens: jest.fn() }));
jest.mock('next/navigation', () => ({ unstable_rethrow: jest.fn() }));
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
	it('posts to the poll\'s read endpoint', async () => {
		mockApiClient.mockResolvedValue({ success: true });
		await markNotificationRead('poll-1');
		expect(mockApiClient).toHaveBeenCalledWith('/notifications/poll-1/read', { method: 'POST' });
	});

	it('ignores a poll with no notification for the user', async () => {
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		mockApiClient.mockRejectedValue(new ApiError('nf', 404, { errorCode: 'notification.not_found' }));
		await expect(markNotificationRead('poll-1')).resolves.toBeUndefined();
		expect(spy).not.toHaveBeenCalled();
		spy.mockRestore();
	});

	it('ignores a Deleted poll', async () => {
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		mockApiClient.mockRejectedValue(new ApiError('nf', 404, { errorCode: 'vote.not_found' }));
		await expect(markNotificationRead('poll-1')).resolves.toBeUndefined();
		expect(spy).not.toHaveBeenCalled();
		spy.mockRestore();
	});
});

describe('getNotifications()', () => {
	it('reads a page of the feed', async () => {
		const item = { id: 'follow_1', kind: 'FOLLOWED', createdAt: '2026-10-26T10:00:00Z', read: false, actor: {
			id: 'u1', username: 'bob', isFollowing: false, followsYou: true,
		}, poll: null, comment: null };
		mockApiClient.mockResolvedValue({ items: [item], nextCursor: 'c2' });
		const result = await getNotifications('c1');
		expect(mockApiClient).toHaveBeenCalledWith('/notifications?limit=20&cursor=c1');
		expect(result).toMatchObject({ ok: true, data: { nextCursor: 'c2', items: [{ id: 'follow_1', kind: 'FOLLOWED' }] } });
	});

	it('returns the failure instead of throwing', async () => {
		mockApiClient.mockRejectedValue(new ApiError('bad', 400, { errorCode: 'common.cursor_invalid' }));
		expect(await getNotifications('x')).toMatchObject({ ok: false, errorCode: 'common.cursor_invalid' });
	});
});

describe('markAllNotificationsRead()', () => {
	it('posts to read-all', async () => {
		mockApiClient.mockResolvedValue(undefined);
		expect(await markAllNotificationsRead()).toEqual({ ok: true, data: undefined });
		expect(mockApiClient).toHaveBeenCalledWith('/notifications/read-all', { method: 'POST' });
	});
});

describe('notification preferences', () => {
	const prefs = { resultsIn: true, invitations: true, comments: false, closingSoon: false };

	it('reads the four switches', async () => {
		mockApiClient.mockResolvedValue(prefs);
		expect(await getNotificationPreferences()).toEqual({ ok: true, data: prefs });
		expect(mockApiClient).toHaveBeenCalledWith('/users/me/notification-preferences');
	});

	it('sends only the switch that changed', async () => {
		mockApiClient.mockResolvedValue(prefs);
		await updateNotificationPreferences({ comments: false });
		expect(mockApiClient).toHaveBeenCalledWith('/users/me/notification-preferences', {
			method: 'PATCH',
			body: JSON.stringify({ comments: false }),
		});
	});
});
