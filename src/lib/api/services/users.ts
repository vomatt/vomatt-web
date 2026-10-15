'use server';

import { revalidateTag, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { clearAuthTokens } from '@/lib/api/auth';
import { apiClient, ApiError, publicFetch } from '@/lib/api/client';
import { PROFILES_TAG } from '@/lib/api/constants';
import { cursorPageSchema, pageParams } from '@/lib/api/cursor';
import { UserDtoSchema } from '@/schemas/user';
import { MyProfile, UserProfile } from '@/types/user';

export async function getUserProfile(username: string): Promise<UserProfile | null> {
  try {
    return await publicFetch<UserProfile>(
      `/users/${encodeURIComponent(username)}`,
      { next: { revalidate: 60, tags: [PROFILES_TAG] } } as RequestInit
    );
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) return null;
    throw error;
  }
}

const UserSearchPage = cursorPageSchema(UserDtoSchema);

/**
 * Signed-in only; a partial, case-insensitive username match, by username.
 * Items carry public fields only (`displayName` is null when hidden).
 */
export async function searchUsers(username: string, cursor?: string, limit = 20) {
  const params = pageParams(cursor, limit);
  params.set('username', username);
  return UserSearchPage.parse(await apiClient(`/users/search?${params}`));
}

export async function deleteUser(userId: string) {
  return apiClient(`/users/${userId}`, { method: 'DELETE' });
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

/** Omitted fields stay as they are. */
export async function updateProfile(data: { username?: string; displayName?: string; bio?: string }) {
  const profile = await apiClient<UserProfile>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (data.username) {
    // Expire without re-rendering: this page's URL is the old username, which now 404s.
    // The caller navigates to the new URL instead.
    revalidateTag(PROFILES_TAG, { expire: 0 });
  } else {
    updateTag(PROFILES_TAG);
  }
  return profile;
}

/** updateProfile for forms that show the API's (localized) error message. */
export async function editProfile(
  data: Parameters<typeof updateProfile>[0]
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await updateProfile(data);
  } catch (error) {
    // Returned, not thrown: production hides thrown Server Action messages
    return { ok: false, message: error instanceof Error ? error.message : 'Request failed' };
  }
  return { ok: true };
}

export async function updateVisibility(visibility: Record<string, boolean>) {
  const settings = await apiClient<Record<string, boolean>>('/users/me/visibility', {
    method: 'PATCH',
    body: JSON.stringify({ visibility }),
  });
  // Expire public profiles without re-rendering this page; the switch already shows the change
  revalidateTag(PROFILES_TAG, { expire: 0 });
  return settings;
}

/**
 * Permanently deletes the signed-in user's account; the backend also
 * revokes every session. Resolves only on failure: success redirects home.
 */
export async function deleteMyAccount(): Promise<{ ok: false; message: string }> {
  try {
    await deleteUser((await getMyProfile()).id);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Request failed' };
  }
  await clearAuthTokens();
  redirect('/?account_deleted=1');
}
