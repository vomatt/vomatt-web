import {
	getNotificationPreferences,
	getNotifications,
	getUnreadCount,
	getUnreadNotificationIds,
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

jest.mock('next/cache', () => ({ refresh: jest.fn() }));

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

beforeEach(() => jest.clearAllMocks());

describe('getUnreadCount()', () => {
	it('reads the count', async () => {
		mockApiClient.mockResolvedValue({ count: 3 });
		expect(await getUnreadCount()).toBe(3);
		expect(mockApiClient).toHaveBeenCalledWith('/notifications/unread-count');
	});
});

describe('getUnreadCount() for a category', () => {
	it('counts one tab', async () => {
		mockApiClient.mockResolvedValue({ count: 2 });
		expect(await getUnreadCount('LIKE')).toBe(2);
		expect(mockApiClient).toHaveBeenCalledWith('/notifications/unread-count?category=LIKE');
	});
});

describe('getUnreadCount() when signed out', () => {
	it('returns null instead of throwing', async () => {
		mockApiClient.mockRejectedValue(new AuthError('expired'));
		expect(await getUnreadCount()).toBeNull();
	});
});

describe('getUnreadNotificationIds()', () => {
	it('reads the ids, for a category when given', async () => {
		mockApiClient.mockResolvedValue({ ids: ['comment_1', 'result_2'] });
		expect(await getUnreadNotificationIds()).toEqual(['comment_1', 'result_2']);
		expect(mockApiClient).toHaveBeenCalledWith('/notifications/unread-ids');
		await getUnreadNotificationIds('LIKE');
		expect(mockApiClient).toHaveBeenLastCalledWith('/notifications/unread-ids?category=LIKE');
	});
});

describe('markNotificationRead()', () => {
	const { refresh } = jest.requireMock('next/cache');
	// The unread count before the read, the read, then the count after
	const respond = (before: number, after: number) =>
		mockApiClient
			.mockResolvedValueOnce({ count: before })
			.mockResolvedValueOnce({ success: true })
			.mockResolvedValueOnce({ count: after });

	it('posts the feed item\'s id to its read endpoint and returns the count after', async () => {
		respond(2, 1);
		expect(await markNotificationRead('comment_0199')).toBe(1);
		expect(mockApiClient).toHaveBeenCalledWith('/notifications/comment_0199/read', { method: 'POST' });
	});

	it('refreshes when the read lowered the count, so pages kept from before drop their unread marks', async () => {
		respond(2, 1);
		await markNotificationRead('poll-1');
		expect(refresh).toHaveBeenCalled();
	});

	it('skips the refresh when the notification was already read', async () => {
		respond(2, 2);
		await markNotificationRead('poll-1');
		expect(refresh).not.toHaveBeenCalled();
	});

	it('refreshes when the count is capped, since 100 can hide a read', async () => {
		respond(100, 100);
		await markNotificationRead('poll-1');
		expect(refresh).toHaveBeenCalled();
	});

	it('refreshes and returns null when a count check fails', async () => {
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		mockApiClient
			.mockResolvedValueOnce({ count: 2 })
			.mockResolvedValueOnce({ success: true })
			.mockRejectedValueOnce(new ApiError('down', 503, {}));
		expect(await markNotificationRead('poll-1')).toBeNull();
		expect(refresh).toHaveBeenCalled();
		spy.mockRestore();
	});

	it('still takes a poll id, for the poll page', async () => {
		respond(1, 0);
		await markNotificationRead('poll-1');
		expect(mockApiClient).toHaveBeenCalledWith('/notifications/poll-1/read', { method: 'POST' });
	});

	it('reports a failed request', async () => {
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		mockApiClient
			.mockResolvedValueOnce({ count: 1 })
			.mockRejectedValueOnce(new ApiError('down', 503, { errorCode: 'common.service_unavailable' }));
		expect(await markNotificationRead('comment_0199')).toBeNull();
		expect(spy).toHaveBeenCalledWith('Marking notification read failed:', expect.anything());
		spy.mockRestore();
	});

	it.each(['notification.not_found', 'vote.not_found'])('quietly ignores %s', async (errorCode) => {
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		mockApiClient.mockResolvedValueOnce({ count: 1 }).mockRejectedValueOnce(new ApiError('nf', 404, { errorCode }));
		await expect(markNotificationRead('poll-1')).resolves.toBeNull();
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

	it('asks for one category and reads a like', async () => {
		mockApiClient.mockResolvedValue({
			items: [
				{ id: 'like_1', kind: 'LIKE', category: 'LIKE', createdAt: '2026-10-26T10:00:00Z', read: false, actor: rosa, poll, comment: { id: 'c1', parentId: null, excerpt: 'Tabs' } },
			],
			nextCursor: null,
		});
		const page = await getNotifications('cur', 'LIKE');
		expect(mockApiClient).toHaveBeenCalledWith('/notifications?limit=20&cursor=cur&category=LIKE');
		expect(page.items[0]).toMatchObject({ kind: 'LIKE', actor: { username: 'rosa' }, comment: { id: 'c1' } });
	});

	it('reads a locked community account in its own tab, with nulls for poll and comment', async () => {
		mockApiClient.mockResolvedValue({
			items: [
				{ id: 'community_locked_9', kind: 'COMMUNITY_LOCKED', category: 'COMMUNITY', createdAt: '2026-10-26T10:00:00Z', read: false, actor: { ...rosa, community: true }, poll: null, comment: null },
			],
			nextCursor: null,
		});
		const page = await getNotifications(null, 'COMMUNITY');
		expect(mockApiClient).toHaveBeenCalledWith('/notifications?limit=20&category=COMMUNITY');
		expect(page.items).toEqual([expect.objectContaining({ id: 'community_locked_9', kind: 'COMMUNITY_LOCKED', actor: expect.objectContaining({ community: true }) })]);
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

describe('markAllNotificationsRead()', () => {
	it('posts to read-all', async () => {
		mockApiClient.mockResolvedValue({ success: true });
		expect(await markAllNotificationsRead()).toEqual({ ok: true, data: undefined });
		expect(mockApiClient).toHaveBeenCalledWith('/notifications/read-all', { method: 'POST' });
	});

	it('returns the failure instead of throwing', async () => {
		mockApiClient.mockRejectedValue(new ApiError('down', 503, {}));
		expect(await markAllNotificationsRead()).toMatchObject({ ok: false, status: 503 });
	});
});

describe('notification preferences', () => {
	const preferences = { resultsIn: true, invitations: true, comments: true, mentions: true, likes: true, closingSoon: false };

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
