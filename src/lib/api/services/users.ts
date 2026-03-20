'use server';

import { apiClient, publicFetch } from '@/lib/api/client';

export async function getUserProfile(username: string) {
  return publicFetch(
    `${process.env.API_URL}/api/v1/users/${encodeURIComponent(username)}`
  );
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

export async function removeAvatar() {
  return apiClient('/api/v1/users/me/avatar', { method: 'DELETE' });
}

export async function followUser(username: string) {
  return apiClient(`/api/v1/users/${encodeURIComponent(username)}/follow`, {
    method: 'POST',
  });
}

export async function unfollowUser(username: string) {
  return apiClient(`/api/v1/users/${encodeURIComponent(username)}/follow`, {
    method: 'DELETE',
  });
}

export async function updateProfile(data: { displayName?: string; bio?: string }) {
  return apiClient('/api/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
