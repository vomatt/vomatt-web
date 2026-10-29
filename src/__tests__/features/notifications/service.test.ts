import {
	getNotificationPreferences,
	getNotifications,
	getUnreadCount,
	MARK_READ_MAX,
	markAllNotificationsRead,
	markNotificationRead,
	markNotificationsRead,
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

const poll = {
	id: 'p1',
	title: 'Ramen?',
	startTime: '2026-10-20T09:00:00+08:00',
	endTime: '2026-10-26T18:00:00+08:00',
	status: 'ENDED',
	turnout: 342,
	myOptionId: 'o1',
	winningOptionIds: ['o1'],
	winningOptionLabels: ['Nagi'],
	tie: false,
};
const rosa = { id: 'u-rosa', username: 'rosa', displayName: 'Rosa', avatarUrl: 'bot:boba', isFollowing: false, followsYou: true };

describe('getNotifications()', () => {
	it('reads a page whose items carry all their rows show, with no request per row', async () => {
		mockApiClient.mockResolvedValue({
			items: [
				{ id: 'result_p1', kind: 'RESULT', createdAt: '2026-10-26T10:00:00Z', read: false, actor: null, poll, comment: null },
				{ id: 'follow_1', kind: 'FOLLOWED', createdAt: '2026-10-26T09:00:00Z', read: true, actor: rosa, poll: null, comment: null },
				{
					id: 'comment_r1',
					kind: 'COMMENT',
					createdAt: '2026-10-26T08:00:00Z',
					read: false,
					actor: rosa,
					poll,
					comment: { id: 'r1', parentId: 'c1', excerpt: 'Nagi, and it is not close' },
				},
			],
			nextCursor: 'next',
		});

		const page = await getNotifications('cur');

		expect(mockApiClient).toHaveBeenCalledTimes(1);
		expect(mockApiClient).toHaveBeenCalledWith('/notifications?limit=20&cursor=cur');
		expect(page.nextCursor).toBe('next');
		expect(page.items.map((item) => item.kind)).toEqual(['RESULT', 'FOLLOWED', 'COMMENT']);
		expect(page.items[0]).toMatchObject({ poll: { myOptionId: 'o1', winningOptionLabels: ['Nagi'], tie: false } });
		expect(page.items[1]).toMatchObject({ actor: { isFollowing: false, followsYou: true } });
		expect(page.items[2]).toMatchObject({ comment: { id: 'r1', parentId: 'c1' } });
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
});

describe('markNotificationsRead()', () => {
	it('posts each id to its read endpoint', async () => {
		mockApiClient.mockResolvedValue({ success: true });
		await markNotificationsRead(['comment_1', 'follow_2']);
		expect(mockApiClient).toHaveBeenCalledTimes(2);
		expect(mockApiClient).toHaveBeenCalledWith('/notifications/comment_1/read', { method: 'POST' });
		expect(mockApiClient).toHaveBeenCalledWith('/notifications/follow_2/read', { method: 'POST' });
	});
	it('returns the ids whose request failed', async () => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
		mockApiClient.mockResolvedValueOnce({ success: true }).mockRejectedValueOnce(new ApiError('down', 503, {}));
		expect(await markNotificationsRead(['comment_1', 'follow_2'])).toEqual({ ok: true, data: ['follow_2'] });
	});

	it('reads at most MARK_READ_MAX ids, a few requests at a time, and returns the rest', async () => {
		let open = 0;
		let mostOpen = 0;
		mockApiClient.mockImplementation(async () => {
			mostOpen = Math.max(mostOpen, ++open);
			await Promise.resolve();
			open--;
			return { success: true };
		});
		const ids = Array.from({ length: MARK_READ_MAX + 2 }, (_, i) => `follow_${i}`);
		expect(await markNotificationsRead(ids)).toEqual({ ok: true, data: ids.slice(MARK_READ_MAX) });
		expect(mockApiClient).toHaveBeenCalledTimes(MARK_READ_MAX);
		expect(mostOpen).toBeLessThanOrEqual(5);
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
	const preferences = { resultsIn: true, invitations: true, comments: true, mentions: true, closingSoon: false };

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
