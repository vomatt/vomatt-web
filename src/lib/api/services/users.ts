'use server';

import { revalidateTag, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { type ActionFailure, type ActionResult, attempt } from '@/lib/api/action';
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

/**
 * The profile with the viewer's relation to it (`isFollowing`, `isBlocked`). Never cached:
 * the relation depends on who asks. Null when no one uses the username.
 */
export async function getUserProfileForViewer(username: string): Promise<UserProfile | null> {
  try {
    return await apiClient<UserProfile>(`/users/${encodeURIComponent(username)}`, {
      auth: 'optional',
      cache: 'no-store',
    });
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

export async function getMyProfile(): Promise<MyProfile> {
  return apiClient<MyProfile>('/users/me');
}

/** Omitted fields stay as they are. */
export async function updateProfile(data: {
  username?: string;
  displayName?: string;
  bio?: string;
  firstName?: string;
  lastName?: string;
  /** yyyy-MM-dd; cannot be cleared */
  birthday?: string;
  anonymousBallotByDefault?: boolean;
}) {
  const profile = await apiClient<UserProfile>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (data.username) {
    // Expire without re-rendering: this page's URL is the old username, which now 404s.
    // The caller navigates to the new URL instead.
    revalidateTag(PROFILES_TAG, { expire: 0 });
  } else if (Object.keys(data).some((field) => field !== 'anonymousBallotByDefault')) {
    // The Ballot default is private: no cached public profile shows it
    updateTag(PROFILES_TAG);
  }
  return profile;
}

/** updateProfile for forms that show the API's errorCode or (localized) message. */
export async function editProfile(
  data: Parameters<typeof updateProfile>[0]
): Promise<{ ok: true } | ActionFailure> {
  // Returned, not thrown: production hides thrown Server Action messages
  const result = await attempt(() => updateProfile(data));
  return result.ok ? { ok: true } : result;
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
 * Everything stored about the signed-in user, as the API's JSON text. Once per
 * UTC day: a second call fails with 429 `common.rate_limited`.
 */
export async function exportMyData(): Promise<ActionResult<string>> {
  return attempt(async () => JSON.stringify(await apiClient<unknown>('/users/me/export'), null, 2));
}

/**
 * Permanently deletes the signed-in user's account; the backend also
 * revokes every session. Resolves only on failure: success redirects home.
 * A refusal carries the API's errorCode (e.g. 409 `admin.last_admin`).
 */
export async function deleteMyAccount(): Promise<ActionFailure> {
  const result = await attempt(async () => deleteUser((await getMyProfile()).id));
  if (!result.ok) return result;
  await clearAuthTokens();
  redirect('/?account_deleted=1');
}
