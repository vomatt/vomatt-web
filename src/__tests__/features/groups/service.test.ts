import {
	addGroupMembers,
	createGroup,
	deleteGroup,
	getGroupMembers,
	getGroups,
	removeGroupMember,
	renameGroup,
} from '@/features/groups/service';
import { apiClient, ApiError } from '@/lib/api/client';

jest.mock('next/navigation', () => ({ unstable_rethrow: jest.fn() }));
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
	class AuthError extends Error {}
	return { apiClient: jest.fn(), ApiError, AuthError };
});

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

const group = { id: 'g1', name: 'Book club', memberCount: 2, createdAt: '2026-10-09T15:20:31+08:00' };
const members = [
	{ userId: 'u1', username: 'bob', email: null, addedAt: '2026-10-09T15:20:31+08:00' },
	{ userId: null, username: null, email: 'dave@example.com', addedAt: '2026-10-09T15:20:31+08:00' },
];

beforeEach(() => jest.clearAllMocks());

it('lists the Groups', async () => {
	mockApiClient.mockResolvedValue([group]);
	expect(await getGroups()).toEqual({ ok: true, data: [group] });
	expect(mockApiClient).toHaveBeenCalledWith('/groups');
});

it('creates and renames by name', async () => {
	mockApiClient.mockResolvedValue(group);
	await createGroup('Book club');
	expect(mockApiClient).toHaveBeenCalledWith('/groups', {
		method: 'POST',
		body: JSON.stringify({ name: 'Book club' }),
	});
	await renameGroup('g1', 'Readers');
	expect(mockApiClient).toHaveBeenLastCalledWith('/groups/g1', {
		method: 'PUT',
		body: JSON.stringify({ name: 'Readers' }),
	});
});

it('reports the Group limit without throwing', async () => {
	mockApiClient.mockRejectedValue(new ApiError('Too many', 400, { errorCode: 'group.max_reached' }));
	expect(await createGroup('One more')).toMatchObject({ ok: false, errorCode: 'group.max_reached' });
});

it('deletes', async () => {
	mockApiClient.mockResolvedValue(undefined);
	expect(await deleteGroup('g1')).toEqual({ ok: true, data: undefined });
	expect(mockApiClient).toHaveBeenCalledWith('/groups/g1', { method: 'DELETE' });
});

it('lists and adds members', async () => {
	mockApiClient.mockResolvedValue(members);
	expect(await getGroupMembers('g1')).toEqual({ ok: true, data: members });
	await addGroupMembers('g1', { userIds: ['u1'], emails: ['dave@example.com'] });
	expect(mockApiClient).toHaveBeenLastCalledWith('/groups/g1/members', {
		method: 'POST',
		body: JSON.stringify({ userIds: ['u1'], emails: ['dave@example.com'] }),
	});
});

it('removes a member by ID or by email', async () => {
	mockApiClient.mockResolvedValue([]);
	await removeGroupMember('g1', { userId: 'u1', email: null });
	expect(mockApiClient).toHaveBeenLastCalledWith('/groups/g1/members/u1', { method: 'DELETE' });
	await removeGroupMember('g1', { userId: null, email: 'dave@example.com' });
	expect(mockApiClient).toHaveBeenLastCalledWith('/groups/g1/members?email=dave%40example.com', {
		method: 'DELETE',
	});
});
