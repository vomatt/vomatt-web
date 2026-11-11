'use server';

import { revalidateTag, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { type ActionFailure, type ActionResult, attempt } from '@/lib/api/action';
import { clearAuthTokens } from '@/lib/api/auth';
import { apiClient, ApiError } from '@/lib/api/client';
import { PROFILES_TAG } from '@/lib/api/constants';
import { cursorPageSchema, pageParams } from '@/lib/api/cursor';
import { UserDtoSchema } from '@/schemas/user';
import { type Gender, MyProfile, UserProfile } from '@/types/user';

export async function getUserProfile(username: string): Promise<UserProfile | null> {
  try {
    // Signed in: uncached, since isFollowing / isBlocked are the viewer's. Signed out: the shared 60s cache
    return await apiClient<UserProfile>(`/users/${encodeURIComponent(username)}`, {
      auth: 'optional',
      next: { revalidate: 60, tags: [PROFILES_TAG] },
    } as RequestInit);
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
  /** Cannot be cleared; `UNDISCLOSED` instead */
  gender?: Gender;
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

/**
 * Texts a code that binds `phone` to the signed-in account. A resend inside the cooldown fails with
 * `auth.otp.resend_cooldown`, its seconds in the message (`cooldownSeconds`).
 */
export async function sendPhoneBindOtp(phone: string): Promise<ActionResult> {
  return attempt(async () => {
    await apiClient('/users/me/phone/send-otp', { method: 'POST', body: JSON.stringify({ phone }) });
  });
}

/**
 * Binds the number the code went to; the data is the updated profile. A wrong or expired code is a 401
 * (`auth.invalid_otp`, `auth.otp.invalid_or_expired`, `auth.otp.too_many_attempts`) that doesn't end the
 * session: it comes back as a failure, like any other, for the form to show.
 */
export async function verifyPhoneBind(phone: string, code: string): Promise<ActionResult<MyProfile>> {
  return attempt(() =>
    apiClient<MyProfile>('/users/me/phone/verify', { method: 'POST', body: JSON.stringify({ phone, code }) })
  );
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
 * A refusal carries the API's errorCode (e.g. 409 `admin.last_admin`).
 */
export async function deleteMyAccount(): Promise<ActionFailure> {
  const result = await attempt(async () => deleteUser((await apiClient<MyProfile>('/users/me', { actAs: false })).id));
  if (!result.ok) return result;
  await clearAuthTokens();
  redirect('/?account_deleted=1');
}
