# Avatar Upload & Follow System Design

**Date:** 2026-03-20
**Status:** Approved

## Overview

Add two user features to vomatt: profile picture upload and a follow system. Both are implemented against a mock backend (Next.js API route handlers) that matches the real API contract exactly, so the OpenAPI spec can be regenerated and handed to the backend team without changes.

**How mocks are activated:** Set `API_URL=http://localhost:3000` in `.env.local`. The service layer then resolves all `/api/v1/...` calls to the local Next.js route handlers instead of the real backend. When the real backend is ready, restore `API_URL` to the production URL — no frontend code changes required.

---

## API Contract

All responses use the existing `ApiResponse<T>` envelope: `{ success: true, data: T }`.

Error responses use: `{ success: false, message: string, errorCode?: string }`.

### Avatar

```
PATCH  /api/v1/users/me/avatar    multipart/form-data { file }
       Accepted types: image/jpeg, image/png, image/webp, image/gif
       Max size: 5 MB
       → 200 { data: { avatarUrl: string } }
       → 400 { message: "Invalid file type" }
       → 400 { message: "File too large" }
       → 401 { message: "Not authenticated" }

DELETE /api/v1/users/me/avatar
       → 200 { data: { avatarUrl: null } }
       → 401 { message: "Not authenticated" }
```

### Follow

```
POST   /api/v1/users/:username/follow
       → 200 { data: { following: true } }
       → 400 { message: "Cannot follow yourself" }
       → 404 { message: "User not found" }
       → 401 { message: "Not authenticated" }

DELETE /api/v1/users/:username/follow
       → 200 { data: { following: false } }
       → 401 { message: "Not authenticated" }

GET    /api/v1/users/:username/followers?page=0&size=20   (public)
       → 200 { data: { content: UserSummary[], totalElements: number, totalPages: number, size: number } }
       → 404 { message: "User not found" }

GET    /api/v1/users/:username/following?page=0&size=20   (public)
       → 200 { data: { content: UserSummary[], totalElements: number, totalPages: number, size: number } }
       → 404 { message: "User not found" }
```

### Updated Types

```ts
// Additions to UserProfile
avatarUrl: string | null
followersCount: number
followingCount: number
isFollowing?: boolean   // optional — only present when request includes Authorization header

// New
interface UserSummary {
  username: string
  displayName: string | null
  avatarUrl: string | null
}
```

---

## Mock Data Layer

### Local dev setup

In `.env.local`, set `API_URL=http://localhost:3000`. This routes all `apiClient` calls to the local Next.js mock handlers.

### Store: `src/app/api/v1/users/_mock-store.ts`

A module-level singleton shared across all mock route handlers. Resets on dev server restart (acceptable for development).

```ts
avatars: Map<username, avatarUrl>       // base64 data URLs from uploads
follows: Map<follower, Set<followee>>   // tracks follow relationships; source of truth for counts
MOCK_USERS: UserProfile[]               // 5 seeded users (counts derived from follows map, not hardcoded)
```

**Important:** `followersCount` and `followingCount` are always derived from the `follows` map at request time, not from static seed values. This keeps counts consistent with the followers/following list endpoints.

**Seeded follow relationships** are added to the `follows` map so the initial counts are non-zero and the lists are non-empty.

Avatar uploads store the file as a base64 data URL in the mock store (no filesystem writes). This is pragmatic for dev; base64 encoding increases storage size ~33%, acceptable for a few uploads per session.

### Identifying the calling user

Mock routes that require `isFollowing` or auth checks read the `Authorization: Bearer <token>` header and extract the `username` claim by reusing the existing `decodeToken` function from `src/lib/api/auth.ts` (HS512, `SESSION_SECRET`). Do not write a custom decode — reuse the existing helper to ensure algorithm and key consistency.

### Self-follow guard

`POST /api/v1/users/:username/follow` returns 400 when the calling user's username matches `:username`.

### Production safety

All mock route handlers are gated with:
```ts
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ message: 'Not found' }, { status: 404 });
}
```

### Route File Structure

```
src/app/api/v1/users/
  _mock-store.ts
  [username]/
    route.ts           ← GET: enrich profile with avatarUrl, counts, isFollowing
    follow/
      route.ts         ← POST: follow, DELETE: unfollow
    followers/
      route.ts         ← GET: paginated followers list
    following/
      route.ts         ← GET: paginated following list
  me/
    avatar/
      route.ts         ← PATCH: upload (validates type + size), DELETE: remove
```

Note: Next.js resolves the static segment `me` before the dynamic `[username]`, so `me/avatar` and `[username]/follow` routes do not conflict.

---

## Frontend Changes

### Types (`src/types/user.ts`)
- Add `avatarUrl`, `followersCount`, `followingCount`, `isFollowing?` to `UserProfile`
- Add `UserSummary` interface

### Service Layer (`src/lib/api/services/users.ts`)

Avatar upload **cannot** use a Server Action because `File` objects are not serializable across the Server Action boundary. Instead, `uploadAvatar` is a plain async function called directly from the client:

```ts
// Called from client component — NOT a server action
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me/avatar`, {
    method: 'PATCH',
    body: formData,
    headers: { Authorization: `Bearer ${getAccessTokenFromCookie()}` },
  });
  // parse ApiResponse envelope
}
```

All other new functions are server actions:
- `removeAvatar()` — DELETE via `apiClient`
- `followUser(username)` / `unfollowUser(username)` — POST / DELETE via `apiClient`
- `getFollowers(username, page?)` / `getFollowing(username, page?)` — GET via `publicFetch` (public, no auth required)

The existing `getUserProfile` service function currently uses `apiClient` (authenticated). It must be changed to use `publicFetch` to match the public endpoint pattern used by the profile page. Public user profile data should not require authentication.

**Environment variable:** `NEXT_PUBLIC_API_URL` must be added (same value as `API_URL`) in `.env.local` for local dev **and** in all production/staging environment configurations. If `NEXT_PUBLIC_API_URL` is missing in any environment, avatar upload will fail silently. Add it to the deployment checklist alongside `API_URL`.

### `ProfileHeader` component

Currently a Server Component. The interactive elements (avatar click-to-upload, follow button) require client-side state. **Strategy:** keep `ProfileHeader` as a thin Server Component that passes props down to two new Client Component children:

- `AvatarUploader` (`'use client'`) — renders the avatar circle. When `isOwner`: wraps a hidden `<input type="file" accept="image/jpeg,image/png,image/webp,image/gif">` (max 5 MB validated client-side before upload). Conditionally renders `<img>` when `avatarUrl` is non-null, gradient placeholder otherwise. Uses `useAvatarUpload` hook.
- `FollowButton` (`'use client'`) — shown when `!isOwner && session`. Receives `initialIsFollowing` and `initialFollowersCount` as props and owns both as local state. Renders Follow/Unfollow **and** the followers count display so both can update together. Disabled while request is in flight to prevent double-clicks. On optimistic update: set `isFollowing=true`, `followersCount+1`; on error: revert both to their initial values.

The stats strip's Followers count is rendered inside `FollowButton` (not in the Server Component), so the count updates optimistically without a full server re-render.

### `useAvatarUpload` hook

`src/hooks/useAvatarUpload.ts` — shared between `AvatarUploader` and `EditProfileSheet`.

```ts
// Returns: { avatarUrl, isUploading, upload(file), remove() }
// avatarUrl: local state initialized from initialAvatarUrl prop, updated immediately on API success
//   (preview updates instantly without waiting for router.refresh())
// On success: calls router.refresh() to sync Server Components in the background
// Client-side validation: file type (whitelist) + file size (≤ 5 MB) before sending
```

### `EditProfileSheet` component

- Add `initialAvatarUrl: string | null` prop
- New avatar section at top: current avatar preview + "Change photo" button (triggers file picker) + "Remove photo" button (hidden when no avatar)
- Uses `useAvatarUpload` hook
- After a successful avatar change the hook calls `router.refresh()` — the sheet stays open so the user can continue editing other fields

### New: `FollowersSheet` component

`src/app/(frontend)/profile/[username]/_components/FollowersSheet.tsx`

- `'use client'` — required for open/close state and fetch-on-open behavior
- Props: `username: string`, `type: 'followers' | 'following'`, `open: boolean`, `onOpenChange`
- Fetches page 0 (up to 20 results) when `open` becomes `true` (not on every render)
- States: loading skeleton, empty message ("No followers yet" / "Not following anyone yet"), error message ("Failed to load — try again"), list of `UserSummary` rows
- Each row: avatar thumbnail + display name + `@username`, links to `/profile/:username`
- Uses existing `Sheet` primitive

### `AppSidebar` component

`userSession` is decoded from the JWT — `avatarUrl` is not a JWT claim and will not be present. The sidebar avatar is updated by making a lightweight `GET /api/v1/users/me` fetch on the server side in the root layout, which already calls `getUserSession()`. The fetched profile is passed down to `AppSidebar` alongside the session.

Alternatively, if a `GET /api/v1/users/me` endpoint does not exist in the real backend, `avatarUrl` is passed from the profile fetch only when the user is on their own profile. In this case the sidebar shows initials everywhere else. **Recommended:** add `GET /api/v1/users/me` to the API contract and fetch it in the root layout.

---

## Data Flow

```
Avatar upload (click on profile):
  User clicks avatar (isOwner) → AvatarUploader hidden input →
  useAvatarUpload.upload(file) → client-side validation →
  fetch PATCH /api/v1/users/me/avatar (mock or real) →
  avatarUrl returned → hook updates local state + router.refresh()

Avatar upload (Edit Profile sheet):
  User clicks "Change photo" → same useAvatarUpload hook →
  same flow as above; sheet stays open

Follow:
  User clicks Follow → FollowButton →
  optimistic update (isFollowing=true, followersCount+1) →
  followUser(username) server action →
  POST /api/v1/users/:username/follow →
  on error: revert both isFollowing and followersCount

View followers/following:
  User clicks count → FollowersSheet opens →
  getFollowers / getFollowing (publicFetch) →
  loading skeleton → UserSummary list rendered
```

---

## Implementation Notes

- `DELETE /api/v1/users/me/avatar` is idempotent: the mock must return `{ avatarUrl: null }` even if no avatar exists in the store (do not 404).
- `DELETE /api/v1/users/:username/follow` is also idempotent: unfollowing someone not currently followed returns `{ following: false }`.

## Out of Scope

- Notifications for new followers
- Mutual follow / "follows you" indicator
- Image cropping/resizing on upload (backend handles in production)
- Pagination UI in FollowersSheet (load-more when needed)
- `GET /api/v1/users/me` mock route (left for a follow-up; sidebar shows initials for now unless the profile fetch is reused)
