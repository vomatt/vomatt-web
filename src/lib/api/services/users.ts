'use server';

import { redirect } from 'next/navigation';

import { clearAuthTokens } from '@/lib/api/auth';
import { apiClient, ApiError, publicFetch } from '@/lib/api/client';
import { MyProfile, UserProfile } from '@/types/user';

export async function getUserProfile(username: string): Promise<UserProfile | null> {
  try {
    return await publicFetch<UserProfile>(
      `/users/${encodeURIComponent(username)}`,
      { next: { revalidate: 60 } } as RequestInit
    );
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) return null;
    throw error;
  }
}

export async function searchUsers(username: string, page?: number, size?: number) {
  const params = new URLSearchParams({ username });
  if (page !== undefined) params.set('page', String(page));
  if (size !== undefined) params.set('size', String(size));
  return apiClient(`/users/search?${params}`);
}

export async function deleteUser(userId: string) {
  return apiClient(`/users/${userId}`, { method: 'DELETE' });
}

export async function removeAvatar() {
  return apiClient('/users/me/avatar', { method: 'DELETE' });
}

export async function followUser(username: string) {
  return apiClient(`/users/${encodeURIComponent(username)}/follow`, {
    method: 'POST',
  });
}

export async function unfollowUser(username: string) {
  return apiClient(`/users/${encodeURIComponent(username)}/follow`, {
    method: 'DELETE',
  });
}

export async function getMyProfile(): Promise<MyProfile> {
  return apiClient<MyProfile>('/users/me');
}

export async function updateProfile(data: { displayName?: string; bio?: string }) {
  return apiClient<UserProfile>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateVisibility(visibility: Record<string, boolean>) {
  return apiClient<Record<string, boolean>>('/users/me/visibility', {
    method: 'PATCH',
    body: JSON.stringify({ visibility }),
  });
}

/**
 * Permanently deletes the signed-in user's account; the backend also
 * revokes every session. Resolves only on failure: success redirects home.
 */
export async function deleteMyAccount(): Promise<{ ok: false; message: string }> {
  try {
    const me = await apiClient<MyProfile>('/users/me');
    await apiClient(`/users/${encodeURIComponent(me.id)}`, { method: 'DELETE' });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Request failed' };
  }
  await clearAuthTokens();
  redirect('/?account_deleted=1');
}
