import { apiClient } from '@/lib/api/client';

import {
	deleteUser,
	getUserProfile,
	searchUsers,
} from '@/lib/api/services/users';

jest.mock('@/lib/api/client', () => ({
	apiClient: jest.fn(),
}));

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

beforeEach(() => {
	mockApiClient.mockClear();
	mockApiClient.mockResolvedValue(undefined);
});

describe('getUserProfile()', () => {
	it('sends GET to /api/v1/users/{username}', async () => {
		await getUserProfile('alice');
		expect(mockApiClient).toHaveBeenCalledWith('/api/v1/users/alice');
	});
});

describe('searchUsers()', () => {
	it('sends GET with username query param', async () => {
		await searchUsers('bob');
		expect(mockApiClient).toHaveBeenCalledWith(
			'/api/v1/users/search?username=bob'
		);
	});

	it('includes page param when provided', async () => {
		await searchUsers('bob', 2);
		expect(mockApiClient).toHaveBeenCalledWith(
			'/api/v1/users/search?username=bob&page=2'
		);
	});

	it('includes size param when provided', async () => {
		await searchUsers('bob', 0, 20);
		expect(mockApiClient).toHaveBeenCalledWith(
			'/api/v1/users/search?username=bob&page=0&size=20'
		);
	});
});

describe('deleteUser()', () => {
	it('sends DELETE to /api/v1/users/{userId}', async () => {
		await deleteUser('user-123');
		expect(mockApiClient).toHaveBeenCalledWith('/api/v1/users/user-123', {
			method: 'DELETE',
		});
	});
});
