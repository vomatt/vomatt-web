'use server';

import { apiClient } from '@/lib/api/client';

export async function updateProfile(data: { displayName?: string; bio?: string }) {
	return apiClient('/api/v1/users/me', {
		method: 'PATCH',
		body: JSON.stringify(data),
	});
}
