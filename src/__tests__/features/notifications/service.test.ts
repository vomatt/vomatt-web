import { getUnreadCount, markNotificationRead } from '@/features/notifications/service';
import { apiClient, ApiError } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => {
	class ApiError extends Error {
		constructor(
			message: string,
			public statusCode: number,
			public data?: any
		) {
			super(message);
		}
	}
	return { apiClient: jest.fn(), ApiError };
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
});
