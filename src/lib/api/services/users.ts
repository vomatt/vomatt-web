'use server';

import { apiClient } from '@/lib/api/client';

export async function updateProfile(data: { displayName?: string; bio?: string }) {
	return apiClient('/api/v1/users/me', {
		method: 'PATCH',
		body: JSON.stringify(data),
	});
}

export async function getUserProfile(username: string) {
	return apiClient(`/api/v1/users/${username}`);
}

export async function searchUsers(username: string, page?: number, size?: number) {
	const params = new URLSearchParams({ username });
	if (page !== undefined) params.set('page', String(page));
	if (size !== undefined) params.set('size', String(size));
	return apiClient(`/api/v1/users/search?${params}`);
}

export async function deleteUser(userId: string) {
	return apiClient(`/api/v1/users/${userId}`, { method: 'DELETE' });
}
