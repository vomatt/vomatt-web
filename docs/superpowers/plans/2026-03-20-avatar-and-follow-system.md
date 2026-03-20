# Avatar Upload & Follow System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add profile picture upload and a mutual follow system to vomatt, backed by Next.js mock API routes that match the real API contract.

**Architecture:** Next.js route handlers under `src/app/api/v1/users/` act as the mock backend. An in-memory store module (`_mock-store.ts`) holds state shared across all route handlers. The existing `apiClient`/`publicFetch` service layer calls these routes when `API_URL=http://localhost:3000` in `.env.local`. Swapping to the real backend requires only an env var change.

**Tech Stack:** Next.js 16 App Router, TypeScript, shadcn/ui (Sheet, Skeleton), React Testing Library, Jest (jsdom), `jose` for JWT decode.

---

## File Map

**Create:**
- `src/app/api/v1/users/_mock-store.ts` — in-memory state + pure helpers (follow graph, avatar map, seeded users)
- `src/app/api/v1/users/me/avatar/route.ts` — PATCH upload + DELETE remove
- `src/app/api/v1/users/[username]/route.ts` — GET user profile with enriched fields
- `src/app/api/v1/users/[username]/follow/route.ts` — POST follow + DELETE unfollow
- `src/app/api/v1/users/[username]/followers/route.ts` — GET paginated followers list
- `src/app/api/v1/users/[username]/following/route.ts` — GET paginated following list
- `src/lib/api/avatar-upload.ts` — client-callable `uploadAvatar` (no `'use server'` — File is not serialisable across the Server Action boundary)
- `src/lib/api/users-public.ts` — client-callable `getFollowers`/`getFollowing` (no `'use server'` — called from a `useEffect` in a Client Component)
- `src/hooks/useAvatarUpload.ts` — shared hook for upload/remove + optimistic preview
- `src/app/(frontend)/profile/[username]/_components/AvatarUploader.tsx` — avatar circle, click-to-upload when owner
- `src/app/(frontend)/profile/[username]/_components/FollowButton.tsx` — follow/unfollow + owns followers count display
- `src/app/(frontend)/profile/[username]/_components/FollowersSheet.tsx` — sheet listing followers or following
- `src/__tests__/api/mock-store.test.ts` — pure function tests for the store
- `src/__tests__/lib/avatar-upload.test.ts`
- `src/__tests__/hooks/useAvatarUpload.test.ts`
- `src/__tests__/components/AvatarUploader.test.tsx`
- `src/__tests__/components/FollowButton.test.tsx`
- `src/__tests__/components/FollowersSheet.test.tsx`

**Modify:**
- `.env.local` — add `NEXT_PUBLIC_API_URL`; verify `SESSION_SECRET` is present (required by mock routes for JWT decode)
- `src/types/user.ts` — add `avatarUrl`, `followersCount`, `followingCount`, `isFollowing?`; add `UserSummary`
- `src/lib/api/services/users.ts` — fix `getUserProfile` to use `publicFetch`; add `removeAvatar`, `followUser`, `unfollowUser`
- `src/__tests__/services/users.test.ts` — update for changed `getUserProfile`; add tests for new server-action functions
- `src/app/(frontend)/profile/[username]/_components/ProfileHeader.tsx` — convert to `'use client'`; integrate `AvatarUploader`, `FollowButton`, `FollowersSheet`, follower/following count buttons; accept `isAuthenticated` prop
- `src/app/(frontend)/profile/[username]/_components/EditProfileSheet.tsx` — add `initialAvatarUrl` prop and avatar section
- `src/app/(frontend)/profile/[username]/page.tsx` — pass `isAuthenticated` to `ProfileHeader`
- `src/app/(frontend)/account/_components/AccountPage.tsx` — pass `isAuthenticated={true}` to `ProfileHeader`

---

## Task 1: Environment Setup

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Add NEXT_PUBLIC_API_URL**

Open `.env.local` and add after `API_URL`:
```
NEXT_PUBLIC_API_URL=https://vomatt-api.zeabur.app
```

- [ ] **Step 2: Enable mock mode**

Change `API_URL` to point at localhost to activate the local mock routes:
```
API_URL=http://localhost:3000
```
(Revert to the real URL when done developing the mock.)

- [ ] **Step 3: Verify SESSION_SECRET is present**

Check that `SESSION_SECRET` exists in `.env.local`. The mock route handlers call `decodeToken` (from `src/lib/api/auth.ts`) which uses `SESSION_SECRET` for JWT verification. Without it, `decodeToken` returns `undefined` and every mock route returns 401.

If it is missing, add:
```
SESSION_SECRET=<your-secret>
```

> Note: `NEXT_PUBLIC_API_URL` is used only by `uploadAvatar` on the client. Avatar upload sends `credentials: 'include'` (cookies), which works because the mock target (`http://localhost:3000`) is the same origin as the Next.js dev server. For production with a real backend, a server-side proxy would be needed; that is out of scope.

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```
Expected: dev server starts, no env warnings.

- [ ] **Step 5: Commit**

```bash
git add .env.local
git commit -m "chore: add NEXT_PUBLIC_API_URL and enable mock mode for avatar/follow"
```

---

## Task 2: Update Types

**Files:**
- Modify: `src/types/user.ts`

- [ ] **Step 1: Confirm baseline type-check passes**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: 0 errors.

- [ ] **Step 2: Update types**

Replace the full contents of `src/types/user.ts`:

```ts
export interface UserProfile {
  username: string;
  displayName: string | null;
  bio: string | null;
  joinedAt: string; // ISO date string
  totalPolls: number;
  totalVotes: number;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean; // only present when request includes Authorization header
}

export interface UserSummary {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}
```

- [ ] **Step 3: Run type-check**

```bash
npx tsc --noEmit
```
Expected: may show errors in files that use `UserProfile` — those are fixed in later tasks. Errors only in files on the modification list are acceptable. Fix any others now.

- [ ] **Step 4: Commit**

```bash
git add src/types/user.ts
git commit -m "feat: extend UserProfile with avatar and follow fields; add UserSummary type"
```

---

## Task 3: Mock Store

**Files:**
- Create: `src/app/api/v1/users/_mock-store.ts`
- Create: `src/__tests__/api/mock-store.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/api/mock-store.test.ts`:

```ts
describe('mock store helpers', () => {
  let store: typeof import('@/app/api/v1/users/_mock-store');

  beforeEach(() => {
    jest.resetModules();
    store = require('@/app/api/v1/users/_mock-store');
  });

  afterEach(() => {
    // Clean up any mutations made during individual tests
    store.avatars.clear();
    // Re-apply seed data for follows
    store.follows.clear();
    store.follows.set('alice', new Set(['bob', 'carol', 'eva']));
    store.follows.set('bob', new Set(['alice', 'eva']));
    store.follows.set('carol', new Set(['alice']));
    store.follows.set('eva', new Set(['alice', 'bob', 'carol', 'dave']));
  });

  describe('MOCK_USERS', () => {
    it('has 5 seeded users', () => {
      expect(store.MOCK_USERS).toHaveLength(5);
    });

    it('every user has required fields', () => {
      for (const u of store.MOCK_USERS) {
        expect(u).toHaveProperty('username');
        expect(u).toHaveProperty('joinedAt');
        expect(typeof u.totalPolls).toBe('number');
        expect(typeof u.totalVotes).toBe('number');
      }
    });
  });

  describe('follow graph', () => {
    it('getFollowersCount returns 0 for user with no followers', () => {
      expect(store.getFollowersCount('nobody')).toBe(0);
    });

    it('getFollowingCount returns 0 for user following nobody', () => {
      expect(store.getFollowingCount('nobody')).toBe(0);
    });

    it('isFollowing returns false when not following', () => {
      expect(store.isFollowing('alice', 'nobody')).toBe(false);
    });

    it('isFollowing returns true for seeded relationship', () => {
      expect(store.isFollowing('alice', 'bob')).toBe(true);
    });

    it('getFollowersList length equals getFollowersCount', () => {
      const list = store.getFollowersList('alice');
      const count = store.getFollowersCount('alice');
      expect(count).toBe(list.length);
    });

    it('getFollowingList returns array of strings', () => {
      const list = store.getFollowingList('alice');
      expect(Array.isArray(list)).toBe(true);
      list.forEach((u: string) => expect(typeof u).toBe('string'));
    });
  });

  describe('getEnrichedProfile', () => {
    it('returns null for unknown username', () => {
      expect(store.getEnrichedProfile('nobody', null)).toBeNull();
    });

    it('returns profile with derived follower and following counts', () => {
      const profile = store.getEnrichedProfile('alice', null);
      expect(profile).not.toBeNull();
      expect(typeof profile!.followersCount).toBe('number');
      expect(typeof profile!.followingCount).toBe('number');
    });

    it('followersCount matches getFollowersList length — not a hardcoded value', () => {
      const profile = store.getEnrichedProfile('alice', null);
      expect(profile!.followersCount).toBe(store.getFollowersList('alice').length);
    });

    it('includes isFollowing when callerUsername is provided', () => {
      const profile = store.getEnrichedProfile('alice', 'bob');
      expect(profile).toHaveProperty('isFollowing');
    });

    it('does not include isFollowing when callerUsername is null', () => {
      const profile = store.getEnrichedProfile('alice', null);
      expect(profile!.isFollowing).toBeUndefined();
    });

    it('avatarUrl comes from avatars map', () => {
      store.avatars.set('alice', 'data:image/png;base64,abc');
      const profile = store.getEnrichedProfile('alice', null);
      expect(profile!.avatarUrl).toBe('data:image/png;base64,abc');
    });

    it('avatarUrl is null when no avatar uploaded', () => {
      const profile = store.getEnrichedProfile('bob', null);
      expect(profile!.avatarUrl).toBeNull();
    });
  });

  describe('getUserSummaries', () => {
    it('returns UserSummary list for valid usernames', () => {
      const summaries = store.getUserSummaries(['alice', 'bob']);
      expect(summaries).toHaveLength(2);
      summaries.forEach((s: any) => {
        expect(s).toHaveProperty('username');
        expect(s).toHaveProperty('displayName');
        expect(s).toHaveProperty('avatarUrl');
      });
    });

    it('skips unknown usernames', () => {
      const summaries = store.getUserSummaries(['alice', 'nobody']);
      expect(summaries).toHaveLength(1);
      expect(summaries[0].username).toBe('alice');
    });

    it('returns empty array for empty input', () => {
      expect(store.getUserSummaries([])).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/__tests__/api/mock-store.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '@/app/api/v1/users/_mock-store'`

- [ ] **Step 3: Implement the mock store**

Create `src/app/api/v1/users/_mock-store.ts`:

```ts
import type { UserProfile, UserSummary } from '@/types/user';

// ─── In-memory state ─────────────────────────────────────────────────────────

/** username → base64 data URL */
export const avatars = new Map<string, string>();

/** follower username → Set of followee usernames */
export const follows = new Map<string, Set<string>>();

// ─── Seeded data ──────────────────────────────────────────────────────────────

type SeedUser = Omit<UserProfile, 'followersCount' | 'followingCount' | 'isFollowing' | 'avatarUrl'>;

export const MOCK_USERS: SeedUser[] = [
  {
    username: 'alice',
    displayName: 'Alice Chen',
    bio: 'Poll enthusiast and community builder',
    joinedAt: '2024-01-15T00:00:00Z',
    totalPolls: 12,
    totalVotes: 88,
  },
  {
    username: 'bob',
    displayName: 'Bob Kim',
    bio: 'Data lover. I vote on everything.',
    joinedAt: '2024-02-20T00:00:00Z',
    totalPolls: 5,
    totalVotes: 42,
  },
  {
    username: 'carol',
    displayName: 'Carol Wu',
    bio: null,
    joinedAt: '2024-03-10T00:00:00Z',
    totalPolls: 3,
    totalVotes: 15,
  },
  {
    username: 'dave',
    displayName: null,
    bio: 'Just here to vote',
    joinedAt: '2024-04-01T00:00:00Z',
    totalPolls: 0,
    totalVotes: 30,
  },
  {
    username: 'eva',
    displayName: 'Eva Martinez',
    bio: 'Community builder | 20+ polls created',
    joinedAt: '2024-05-05T00:00:00Z',
    totalPolls: 20,
    totalVotes: 200,
  },
];

// Seed follow relationships so initial counts are non-zero
follows.set('alice', new Set(['bob', 'carol', 'eva']));
follows.set('bob', new Set(['alice', 'eva']));
follows.set('carol', new Set(['alice']));
follows.set('eva', new Set(['alice', 'bob', 'carol', 'dave']));

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function getFollowersCount(username: string): number {
  let count = 0;
  for (const followees of follows.values()) {
    if (followees.has(username)) count++;
  }
  return count;
}

export function getFollowingCount(username: string): number {
  return follows.get(username)?.size ?? 0;
}

export function isFollowing(follower: string, followee: string): boolean {
  return follows.get(follower)?.has(followee) ?? false;
}

/** Returns usernames of everyone who follows `username` */
export function getFollowersList(username: string): string[] {
  const result: string[] = [];
  for (const [follower, followees] of follows.entries()) {
    if (followees.has(username)) result.push(follower);
  }
  return result;
}

/** Returns usernames of everyone `username` follows */
export function getFollowingList(username: string): string[] {
  return Array.from(follows.get(username) ?? []);
}

/**
 * Build a full UserProfile for the given username, enriched with live counts.
 * Returns null if the username is not in MOCK_USERS.
 * Counts are always derived from the `follows` Map — never hardcoded.
 * If callerUsername is provided, includes isFollowing.
 */
export function getEnrichedProfile(
  username: string,
  callerUsername: string | null
): UserProfile | null {
  const seed = MOCK_USERS.find((u) => u.username === username);
  if (!seed) return null;

  const profile: UserProfile = {
    ...seed,
    avatarUrl: avatars.get(username) ?? null,
    followersCount: getFollowersCount(username),
    followingCount: getFollowingCount(username),
  };

  if (callerUsername !== null) {
    profile.isFollowing = isFollowing(callerUsername, username);
  }

  return profile;
}

/** Convert a list of usernames into UserSummary objects. Skips unknowns. */
export function getUserSummaries(usernames: string[]): UserSummary[] {
  return usernames.flatMap((username) => {
    const seed = MOCK_USERS.find((u) => u.username === username);
    if (!seed) return [];
    return [
      {
        username: seed.username,
        displayName: seed.displayName,
        avatarUrl: avatars.get(username) ?? null,
      },
    ];
  });
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest src/__tests__/api/mock-store.test.ts --no-coverage
```
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/v1/users/_mock-store.ts src/__tests__/api/mock-store.test.ts
git commit -m "feat: add mock store for avatar and follow system"
```

---

## Task 4: Avatar Mock Route

**Files:**
- Create: `src/app/api/v1/users/me/avatar/route.ts`

- [ ] **Step 1: Implement the route**

Create `src/app/api/v1/users/me/avatar/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';

import { decodeToken } from '@/lib/api/auth';
import { avatars } from '../_mock-store';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

function err(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

async function getCallerUsername(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const payload = await decodeToken(token);
  return payload?.username ?? payload?.nickName ?? null;
}

export async function PATCH(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const caller = await getCallerUsername(req);
  if (!caller) return err('Not authenticated', 401);

  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof Blob)) return err('No file provided', 400);
  if (!ALLOWED_TYPES.includes(file.type)) return err('Invalid file type', 400);
  if (file.size > MAX_SIZE_BYTES) return err('File too large', 400);

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const avatarUrl = `data:${file.type};base64,${base64}`;

  avatars.set(caller, avatarUrl);

  return ok({ avatarUrl });
}

export async function DELETE(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const caller = await getCallerUsername(req);
  if (!caller) return err('Not authenticated', 401);

  // Idempotent: delete regardless of whether an avatar exists
  avatars.delete(caller);

  return ok({ avatarUrl: null });
}
```

- [ ] **Step 2: Smoke test (manual)**

With dev server running (`npm run dev`) and logged in, run in browser DevTools:

```js
const fd = new FormData();
const blob = new Blob(['fake-image-data'], { type: 'image/png' });
fd.append('file', blob, 'test.png');
fetch('/api/v1/users/me/avatar', { method: 'PATCH', body: fd, credentials: 'include' })
  .then(r => r.json()).then(console.log);
```
Expected: `{ success: true, data: { avatarUrl: 'data:image/png;base64,...' } }`

If you see `{ success: false, message: 'Not authenticated' }`, verify `SESSION_SECRET` is set in `.env.local`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/v1/users/me/avatar/route.ts
git commit -m "feat: add mock avatar upload/remove route"
```

---

## Task 5: User Profile Mock Route

**Files:**
- Create: `src/app/api/v1/users/[username]/route.ts`

- [ ] **Step 1: Implement the route**

Create `src/app/api/v1/users/[username]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';

import { decodeToken } from '@/lib/api/auth';
import { getEnrichedProfile } from '../_mock-store';

async function getCallerUsername(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const payload = await decodeToken(token);
  return payload?.username ?? payload?.nickName ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const { username } = await params;
  const caller = await getCallerUsername(req);
  const profile = getEnrichedProfile(username, caller);

  if (!profile) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: profile });
}
```

- [ ] **Step 2: Smoke test**

```bash
curl http://localhost:3000/api/v1/users/alice
```
Expected: `{ "success": true, "data": { "username": "alice", "followersCount": 3, ... } }`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/v1/users/[username]/route.ts
git commit -m "feat: add mock user profile GET route with enriched fields"
```

---

## Task 6: Follow/Unfollow Mock Route

**Files:**
- Create: `src/app/api/v1/users/[username]/follow/route.ts`

- [ ] **Step 1: Implement the route**

Create `src/app/api/v1/users/[username]/follow/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';

import { decodeToken } from '@/lib/api/auth';
import { follows, MOCK_USERS } from '../../_mock-store';

async function getCallerUsername(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const payload = await decodeToken(token);
  return payload?.username ?? payload?.nickName ?? null;
}

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

function err(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const { username } = await params;
  const caller = await getCallerUsername(req);
  if (!caller) return err('Not authenticated', 401);
  if (caller === username) return err('Cannot follow yourself', 400);

  const targetExists = MOCK_USERS.some((u) => u.username === username);
  if (!targetExists) return err('User not found', 404);

  if (!follows.has(caller)) follows.set(caller, new Set());
  follows.get(caller)!.add(username);

  return ok({ following: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const { username } = await params;
  const caller = await getCallerUsername(req);
  if (!caller) return err('Not authenticated', 401);

  // Idempotent: delete regardless of whether they were following
  follows.get(caller)?.delete(username);

  return ok({ following: false });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/v1/users/[username]/follow/route.ts
git commit -m "feat: add mock follow/unfollow route"
```

---

## Task 7: Followers/Following List Mock Routes

**Files:**
- Create: `src/app/api/v1/users/[username]/followers/route.ts`
- Create: `src/app/api/v1/users/[username]/following/route.ts`

- [ ] **Step 1: Create followers route**

Create `src/app/api/v1/users/[username]/followers/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';

import { getFollowersList, getUserSummaries, MOCK_USERS } from '../../_mock-store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const { username } = await params;
  if (!MOCK_USERS.some((u) => u.username === username)) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '0', 10);
  const size = parseInt(searchParams.get('size') ?? '20', 10);

  const all = getFollowersList(username);
  const start = page * size;
  const content = getUserSummaries(all.slice(start, start + size));

  return NextResponse.json({
    success: true,
    data: {
      content,
      totalElements: all.length,
      totalPages: Math.ceil(all.length / size),
      size,
    },
  });
}
```

- [ ] **Step 2: Create following route**

Create `src/app/api/v1/users/[username]/following/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';

import { getFollowingList, getUserSummaries, MOCK_USERS } from '../../_mock-store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const { username } = await params;
  if (!MOCK_USERS.some((u) => u.username === username)) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '0', 10);
  const size = parseInt(searchParams.get('size') ?? '20', 10);

  const all = getFollowingList(username);
  const start = page * size;
  const content = getUserSummaries(all.slice(start, start + size));

  return NextResponse.json({
    success: true,
    data: {
      content,
      totalElements: all.length,
      totalPages: Math.ceil(all.length / size),
      size,
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/v1/users/[username]/followers/route.ts \
        src/app/api/v1/users/[username]/following/route.ts
git commit -m "feat: add mock followers/following list routes"
```

---

## Task 8: Client-Callable Upload and Public List Functions

> **Why separate files:** `uploadAvatar` uses `File` (browser API) — it cannot be in a `'use server'` module because `File` is not serialisable across the Server Action boundary. `getFollowers`/`getFollowing` are called from inside a `useEffect` in a Client Component — they must be plain async functions, not Server Actions (which require invocation via form actions or `startTransition` and run server-side).

**Files:**
- Create: `src/lib/api/avatar-upload.ts`
- Create: `src/lib/api/users-public.ts`
- Create: `src/__tests__/lib/avatar-upload.test.ts`

- [ ] **Step 1: Write failing tests for avatar-upload**

Create `src/__tests__/lib/avatar-upload.test.ts`:

```ts
import { uploadAvatar } from '@/lib/api/avatar-upload';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
});

describe('uploadAvatar()', () => {
  it('calls PATCH /api/v1/users/me/avatar with FormData', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { avatarUrl: 'http://example.com/a.jpg' } }),
    });

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await uploadAvatar(file);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/users/me/avatar',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
      })
    );
    expect(result).toEqual({ avatarUrl: 'http://example.com/a.jpg' });
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'File too large' }),
    });

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(uploadAvatar(file)).rejects.toThrow('File too large');
  });

  it('appends file under the key "file"', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { avatarUrl: 'x' } }),
    });

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    await uploadAvatar(file);

    const [, options] = mockFetch.mock.calls[0];
    const body = options.body as FormData;
    expect(body.get('file')).toBe(file);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/__tests__/lib/avatar-upload.test.ts --no-coverage
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement avatar-upload**

Create `src/lib/api/avatar-upload.ts` (no `'use server'` directive):

```ts
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const res = await fetch(`${baseUrl}/api/v1/users/me/avatar`, {
    method: 'PATCH',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? 'Upload failed');
  }

  const body = await res.json();
  return body.data ?? body;
}
```

- [ ] **Step 4: Implement users-public**

Create `src/lib/api/users-public.ts` (no `'use server'` directive):

```ts
import { publicFetch } from '@/lib/api/client';
import type { UserSummary } from '@/types/user';

export interface FollowListPage {
  content: UserSummary[];
  totalElements: number;
  totalPages: number;
  size: number;
}

export async function getFollowers(
  username: string,
  page = 0,
  size = 20
): Promise<FollowListPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return publicFetch<FollowListPage>(
    `${process.env.API_URL}/api/v1/users/${encodeURIComponent(username)}/followers?${params}`
  );
}

export async function getFollowing(
  username: string,
  page = 0,
  size = 20
): Promise<FollowListPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return publicFetch<FollowListPage>(
    `${process.env.API_URL}/api/v1/users/${encodeURIComponent(username)}/following?${params}`
  );
}
```

> Note: `users-public.ts` imports `publicFetch` from `@/lib/api/client`. `publicFetch` calls `fetch` under the hood and is not a Server Action, so it can be used in both server and client contexts.

- [ ] **Step 5: Run tests**

```bash
npx jest src/__tests__/lib/avatar-upload.test.ts --no-coverage
```
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/avatar-upload.ts src/lib/api/users-public.ts \
        src/__tests__/lib/avatar-upload.test.ts
git commit -m "feat: add client-callable uploadAvatar and public getFollowers/getFollowing"
```

---

## Task 9: Update Service Layer (Server Actions)

**Files:**
- Modify: `src/lib/api/services/users.ts`
- Modify: `src/__tests__/services/users.test.ts`

- [ ] **Step 1: Write the failing tests**

Replace `src/__tests__/services/users.test.ts` with:

```ts
import { apiClient, publicFetch } from '@/lib/api/client';

import {
  deleteUser,
  followUser,
  getUserProfile,
  removeAvatar,
  searchUsers,
  unfollowUser,
} from '@/lib/api/services/users';

jest.mock('@/lib/api/client', () => ({
  apiClient: jest.fn(),
  publicFetch: jest.fn(),
}));

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;
const mockPublicFetch = publicFetch as jest.MockedFunction<typeof publicFetch>;

beforeEach(() => {
  mockApiClient.mockClear().mockResolvedValue(undefined);
  mockPublicFetch.mockClear().mockResolvedValue(undefined);
  process.env.API_URL = 'https://example.com';
});

describe('getUserProfile()', () => {
  it('uses publicFetch (unauthenticated), not apiClient', async () => {
    await getUserProfile('alice');
    expect(mockPublicFetch).toHaveBeenCalled();
    expect(mockApiClient).not.toHaveBeenCalled();
  });

  it('calls the correct URL', async () => {
    await getUserProfile('alice');
    expect(mockPublicFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/users/alice')
    );
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

describe('removeAvatar()', () => {
  it('sends DELETE to /api/v1/users/me/avatar', async () => {
    await removeAvatar();
    expect(mockApiClient).toHaveBeenCalledWith('/api/v1/users/me/avatar', {
      method: 'DELETE',
    });
  });
});

describe('followUser()', () => {
  it('sends POST to /api/v1/users/{username}/follow', async () => {
    await followUser('carol');
    expect(mockApiClient).toHaveBeenCalledWith('/api/v1/users/carol/follow', {
      method: 'POST',
    });
  });
});

describe('unfollowUser()', () => {
  it('sends DELETE to /api/v1/users/{username}/follow', async () => {
    await unfollowUser('carol');
    expect(mockApiClient).toHaveBeenCalledWith('/api/v1/users/carol/follow', {
      method: 'DELETE',
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/__tests__/services/users.test.ts --no-coverage
```
Expected: FAIL — `getUserProfile` uses `apiClient`, `removeAvatar`/`followUser`/`unfollowUser` not exported yet.

- [ ] **Step 3: Update service file**

Replace `src/lib/api/services/users.ts` with:

```ts
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
```

> `uploadAvatar`, `getFollowers`, and `getFollowing` are in separate files without `'use server'` — see Task 8.

- [ ] **Step 4: Run tests**

```bash
npx jest src/__tests__/services/users.test.ts --no-coverage
```
Expected: all PASS

- [ ] **Step 5: Run full test suite**

```bash
npm run test
```
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/services/users.ts src/__tests__/services/users.test.ts
git commit -m "feat: update users service — fix getUserProfile to publicFetch, add avatar/follow server actions"
```

---

## Task 10: useAvatarUpload Hook

**Files:**
- Create: `src/hooks/useAvatarUpload.ts`
- Create: `src/__tests__/hooks/useAvatarUpload.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/hooks/useAvatarUpload.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react';

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock('@/lib/api/avatar-upload', () => ({
  uploadAvatar: jest.fn(),
}));
jest.mock('@/lib/api/services/users', () => ({
  removeAvatar: jest.fn(),
}));

const { uploadAvatar } = require('@/lib/api/avatar-upload');
const { removeAvatar } = require('@/lib/api/services/users');

import { useAvatarUpload } from '@/hooks/useAvatarUpload';

beforeEach(() => {
  jest.clearAllMocks();
  uploadAvatar.mockResolvedValue({ avatarUrl: 'https://example.com/new.jpg' });
  removeAvatar.mockResolvedValue({ avatarUrl: null });
});

describe('useAvatarUpload', () => {
  it('initialises avatarUrl from prop', () => {
    const { result } = renderHook(() =>
      useAvatarUpload('https://example.com/initial.jpg')
    );
    expect(result.current.avatarUrl).toBe('https://example.com/initial.jpg');
  });

  it('starts with isUploading=false', () => {
    const { result } = renderHook(() => useAvatarUpload(null));
    expect(result.current.isUploading).toBe(false);
  });

  it('rejects files over 5 MB without calling uploadAvatar', async () => {
    const { result } = renderHook(() => useAvatarUpload(null));
    const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.png', {
      type: 'image/png',
    });
    let error: string | undefined;
    await act(async () => {
      error = await result.current.upload(bigFile);
    });
    expect(error).toMatch(/too large/i);
    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it('rejects disallowed MIME types without calling uploadAvatar', async () => {
    const { result } = renderHook(() => useAvatarUpload(null));
    const bad = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    let error: string | undefined;
    await act(async () => {
      error = await result.current.upload(bad);
    });
    expect(error).toMatch(/type/i);
    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it('calls uploadAvatar and updates avatarUrl on success', async () => {
    const { result } = renderHook(() => useAvatarUpload(null));
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.upload(file);
    });
    expect(uploadAvatar).toHaveBeenCalledWith(file);
    expect(result.current.avatarUrl).toBe('https://example.com/new.jpg');
  });

  it('calls removeAvatar and sets avatarUrl to null', async () => {
    const { result } = renderHook(() =>
      useAvatarUpload('https://example.com/old.jpg')
    );
    await act(async () => {
      await result.current.remove();
    });
    expect(removeAvatar).toHaveBeenCalled();
    expect(result.current.avatarUrl).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/__tests__/hooks/useAvatarUpload.test.ts --no-coverage
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useAvatarUpload.ts`:

```ts
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { uploadAvatar } from '@/lib/api/avatar-upload';
import { removeAvatar } from '@/lib/api/services/users';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface UseAvatarUploadReturn {
  avatarUrl: string | null;
  isUploading: boolean;
  /** Validates and uploads file. Returns an error message on validation failure, undefined on success. */
  upload: (file: File) => Promise<string | undefined>;
  remove: () => Promise<void>;
}

export function useAvatarUpload(initialAvatarUrl: string | null): UseAvatarUploadReturn {
  const router = useRouter();
  // Local state: updated immediately on success so the preview is instant.
  // router.refresh() is called after to sync Server Components in the background.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);

  async function upload(file: File): Promise<string | undefined> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF.';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return 'File too large. Maximum size is 5 MB.';
    }

    setIsUploading(true);
    try {
      const result = await uploadAvatar(file);
      setAvatarUrl(result.avatarUrl);
      router.refresh();
    } finally {
      setIsUploading(false);
    }
    return undefined;
  }

  async function remove() {
    setIsUploading(true);
    try {
      await removeAvatar();
      setAvatarUrl(null);
      router.refresh();
    } finally {
      setIsUploading(false);
    }
  }

  return { avatarUrl, isUploading, upload, remove };
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest src/__tests__/hooks/useAvatarUpload.test.ts --no-coverage
```
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAvatarUpload.ts src/__tests__/hooks/useAvatarUpload.test.ts
git commit -m "feat: add useAvatarUpload hook with client-side validation"
```

---

## Task 11: AvatarUploader Component

**Files:**
- Create: `src/app/(frontend)/profile/[username]/_components/AvatarUploader.tsx`
- Create: `src/__tests__/components/AvatarUploader.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/components/AvatarUploader.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';

jest.mock('@/hooks/useAvatarUpload', () => ({
  useAvatarUpload: jest.fn(() => ({
    avatarUrl: null,
    isUploading: false,
    upload: jest.fn(),
    remove: jest.fn(),
  })),
}));

import AvatarUploader from '@/app/(frontend)/profile/[username]/_components/AvatarUploader';
const { useAvatarUpload } = require('@/hooks/useAvatarUpload');

describe('AvatarUploader', () => {
  beforeEach(() => {
    useAvatarUpload.mockReturnValue({
      avatarUrl: null,
      isUploading: false,
      upload: jest.fn(),
      remove: jest.fn(),
    });
  });

  it('renders gradient placeholder when avatarUrl is null', () => {
    render(<AvatarUploader initialAvatarUrl={null} isOwner={false} />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders img when avatarUrl is set', () => {
    useAvatarUpload.mockReturnValue({
      avatarUrl: 'https://example.com/avatar.jpg',
      isUploading: false,
      upload: jest.fn(),
      remove: jest.fn(),
    });
    render(
      <AvatarUploader
        initialAvatarUrl="https://example.com/avatar.jpg"
        isOwner={false}
      />
    );
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg'
    );
  });

  it('renders hidden file input when isOwner is true', () => {
    render(<AvatarUploader initialAvatarUrl={null} isOwner={true} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
  });

  it('does not render file input when isOwner is false', () => {
    render(<AvatarUploader initialAvatarUrl={null} isOwner={false} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/__tests__/components/AvatarUploader.test.tsx --no-coverage
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement the component**

Create `src/app/(frontend)/profile/[username]/_components/AvatarUploader.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import { toast } from 'sonner';

import { User } from '@/components/ui/SvgIcons';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';

interface AvatarUploaderProps {
  initialAvatarUrl: string | null;
  isOwner: boolean;
}

export default function AvatarUploader({ initialAvatarUrl, isOwner }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { avatarUrl, isUploading, upload } = useAvatarUpload(initialAvatarUrl);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = await upload(file);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Avatar updated');
    }
    e.target.value = ''; // allow selecting the same file again
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={!isOwner || isUploading}
        onClick={() => isOwner && inputRef.current?.click()}
        className={[
          'w-16 h-16 rounded-full overflow-hidden flex items-center justify-center',
          isOwner ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default',
          !avatarUrl ? 'bg-gradient-to-br from-purple-400 to-blue-400' : '',
        ].join(' ')}
        aria-label={isOwner ? 'Change profile picture' : undefined}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile picture"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-8 h-8 text-white" />
        )}
      </button>

      {isOwner && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest src/__tests__/components/AvatarUploader.test.tsx --no-coverage
```
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(frontend)/profile/[username]/_components/AvatarUploader.tsx \
        src/__tests__/components/AvatarUploader.test.tsx
git commit -m "feat: add AvatarUploader client component"
```

---

## Task 12: FollowButton Component

**Files:**
- Create: `src/app/(frontend)/profile/[username]/_components/FollowButton.tsx`
- Create: `src/__tests__/components/FollowButton.test.tsx`

`FollowButton` owns both the followers count display and the Follow/Unfollow toggle so they can update together optimistically without a server re-render.

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/components/FollowButton.test.tsx`:

```tsx
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('@/lib/api/services/users', () => ({
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
}));

import FollowButton from '@/app/(frontend)/profile/[username]/_components/FollowButton';
const { followUser, unfollowUser } = require('@/lib/api/services/users');

beforeEach(() => {
  jest.clearAllMocks();
  followUser.mockResolvedValue({ following: true });
  unfollowUser.mockResolvedValue({ following: false });
});

describe('FollowButton', () => {
  it('renders Follow button when not following', () => {
    render(
      <FollowButton
        username="alice"
        initialIsFollowing={false}
        initialFollowersCount={10}
      />
    );
    expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument();
  });

  it('renders Unfollow button when already following', () => {
    render(
      <FollowButton
        username="alice"
        initialIsFollowing={true}
        initialFollowersCount={10}
      />
    );
    expect(screen.getByRole('button', { name: /unfollow/i })).toBeInTheDocument();
  });

  it('displays the initial followers count', () => {
    render(
      <FollowButton
        username="alice"
        initialIsFollowing={false}
        initialFollowersCount={42}
      />
    );
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('optimistically increments count and shows Unfollow', async () => {
    render(
      <FollowButton
        username="alice"
        initialIsFollowing={false}
        initialFollowersCount={10}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^follow$/i }));
    // Optimistic update is synchronous
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unfollow/i })).toBeInTheDocument();
    await waitFor(() => expect(followUser).toHaveBeenCalledWith('alice'));
  });

  it('reverts count and state when followUser throws', async () => {
    followUser.mockRejectedValue(new Error('Network error'));
    render(
      <FollowButton
        username="alice"
        initialIsFollowing={false}
        initialFollowersCount={10}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^follow$/i }));
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument();
    });
  });

  it('disables the button while the request is in flight', async () => {
    let resolve!: () => void;
    followUser.mockReturnValue(new Promise<void>((res) => { resolve = res; }));
    render(
      <FollowButton
        username="alice"
        initialIsFollowing={false}
        initialFollowersCount={10}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^follow$/i }));
    expect(screen.getByRole('button', { name: /follow/i })).toBeDisabled();
    // Resolve and clean up to avoid act() warning
    await act(async () => { resolve(); });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/__tests__/components/FollowButton.test.tsx --no-coverage
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement the component**

Create `src/app/(frontend)/profile/[username]/_components/FollowButton.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { followUser, unfollowUser } from '@/lib/api/services/users';

interface FollowButtonProps {
  username: string;
  initialIsFollowing: boolean;
  initialFollowersCount: number;
  onOpenFollowers?: () => void;
}

export default function FollowButton({
  username,
  initialIsFollowing,
  initialFollowersCount,
  onOpenFollowers,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    if (isPending) return;
    const wasFollowing = isFollowing;
    const prevCount = followersCount;

    // Optimistic update — both state values change together
    setIsFollowing(!wasFollowing);
    setFollowersCount(wasFollowing ? prevCount - 1 : prevCount + 1);
    setIsPending(true);

    try {
      if (wasFollowing) {
        await unfollowUser(username);
      } else {
        await followUser(username);
      }
    } catch {
      // Revert both on error
      setIsFollowing(wasFollowing);
      setFollowersCount(prevCount);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Followers count — rendered here so it updates optimistically */}
      <button
        type="button"
        onClick={onOpenFollowers}
        className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
      >
        <span className="font-semibold text-foreground text-sm">{followersCount}</span>
        <span className="text-muted-foreground text-xs">Followers</span>
      </button>

      <Button
        variant={isFollowing ? 'outline' : 'default'}
        size="sm"
        onClick={handleToggle}
        disabled={isPending}
      >
        {isFollowing ? 'Unfollow' : 'Follow'}
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest src/__tests__/components/FollowButton.test.tsx --no-coverage
```
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(frontend)/profile/[username]/_components/FollowButton.tsx \
        src/__tests__/components/FollowButton.test.tsx
git commit -m "feat: add FollowButton component with optimistic updates"
```

---

## Task 13: FollowersSheet Component

**Files:**
- Create: `src/app/(frontend)/profile/[username]/_components/FollowersSheet.tsx`
- Create: `src/__tests__/components/FollowersSheet.test.tsx`

`FollowersSheet` is a `'use client'` component. It calls `getFollowers`/`getFollowing` from `src/lib/api/users-public.ts` — plain async functions, not Server Actions. This allows them to be called safely inside `useEffect`.

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/components/FollowersSheet.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('@/lib/api/users-public', () => ({
  getFollowers: jest.fn(),
  getFollowing: jest.fn(),
}));
jest.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

import FollowersSheet from '@/app/(frontend)/profile/[username]/_components/FollowersSheet';
const { getFollowers, getFollowing } = require('@/lib/api/users-public');

const mockPage = {
  content: [{ username: 'bob', displayName: 'Bob Kim', avatarUrl: null }],
  totalElements: 1,
  totalPages: 1,
  size: 20,
};

beforeEach(() => {
  jest.clearAllMocks();
  getFollowers.mockResolvedValue(mockPage);
  getFollowing.mockResolvedValue(mockPage);
});

describe('FollowersSheet', () => {
  it('does not show list content when closed', () => {
    render(
      <FollowersSheet
        username="alice"
        type="followers"
        open={false}
        onOpenChange={jest.fn()}
      />
    );
    expect(screen.queryByText('Bob Kim')).toBeNull();
  });

  it('fetches and shows followers when opened', async () => {
    render(
      <FollowersSheet
        username="alice"
        type="followers"
        open={true}
        onOpenChange={jest.fn()}
      />
    );
    await waitFor(() =>
      expect(screen.getByText('Bob Kim')).toBeInTheDocument()
    );
    expect(getFollowers).toHaveBeenCalledWith('alice', 0);
  });

  it('calls getFollowing when type is "following"', async () => {
    render(
      <FollowersSheet
        username="alice"
        type="following"
        open={true}
        onOpenChange={jest.fn()}
      />
    );
    await waitFor(() => expect(getFollowing).toHaveBeenCalledWith('alice', 0));
  });

  it('shows empty state message when list is empty', async () => {
    getFollowers.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, size: 20 });
    render(
      <FollowersSheet
        username="alice"
        type="followers"
        open={true}
        onOpenChange={jest.fn()}
      />
    );
    await waitFor(() =>
      expect(screen.getByText(/no followers yet/i)).toBeInTheDocument()
    );
  });

  it('shows error message on fetch failure', async () => {
    getFollowers.mockRejectedValue(new Error('Network error'));
    render(
      <FollowersSheet
        username="alice"
        type="followers"
        open={true}
        onOpenChange={jest.fn()}
      />
    );
    await waitFor(() =>
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    );
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/__tests__/components/FollowersSheet.test.tsx --no-coverage
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement the component**

Create `src/app/(frontend)/profile/[username]/_components/FollowersSheet.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { User } from '@/components/ui/SvgIcons';
import { getFollowers, getFollowing } from '@/lib/api/users-public';
import type { UserSummary } from '@/types/user';

interface FollowersSheetProps {
  username: string;
  type: 'followers' | 'following';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FetchState = 'idle' | 'loading' | 'success' | 'error';

export default function FollowersSheet({
  username,
  type,
  open,
  onOpenChange,
}: FollowersSheetProps) {
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [users, setUsers] = useState<UserSummary[]>([]);

  useEffect(() => {
    if (!open) return;
    setFetchState('loading');
    const fetchFn = type === 'followers' ? getFollowers : getFollowing;
    fetchFn(username, 0)
      .then((res) => {
        setUsers(res?.content ?? []);
        setFetchState('success');
      })
      .catch(() => setFetchState('error'));
  }, [open, username, type]);

  const title = type === 'followers' ? 'Followers' : 'Following';
  const emptyMessage =
    type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1 px-4 mt-4">
          {fetchState === 'loading' &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}

          {fetchState === 'error' && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Failed to load — try again.
            </p>
          )}

          {fetchState === 'success' && users.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {emptyMessage}
            </p>
          )}

          {fetchState === 'success' &&
            users.map((user) => (
              <Link
                key={user.username}
                href={`/profile/${user.username}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 py-2 rounded-lg hover:bg-accent/50 transition-colors px-2 -mx-2"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName ?? user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.displayName ?? user.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest src/__tests__/components/FollowersSheet.test.tsx --no-coverage
```
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(frontend)/profile/[username]/_components/FollowersSheet.tsx \
        src/__tests__/components/FollowersSheet.test.tsx
git commit -m "feat: add FollowersSheet component"
```

---

## Task 14: Update EditProfileSheet

**Files:**
- Modify: `src/app/(frontend)/profile/[username]/_components/EditProfileSheet.tsx`

Add `initialAvatarUrl: string | null` prop and an avatar section at the top of the sheet.

- [ ] **Step 1: Replace the component**

Replace the full contents of `src/app/(frontend)/profile/[username]/_components/EditProfileSheet.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/Sheet';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { User } from '@/components/ui/SvgIcons';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { updateProfile } from '@/lib/api/services/users';

interface EditProfileSheetProps {
  initialDisplayName: string;
  initialBio: string;
  initialAvatarUrl: string | null;
}

export default function EditProfileSheet({
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
}: EditProfileSheetProps) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [isPending, setIsPending] = useState(false);

  const { avatarUrl, isUploading, upload, remove } = useAvatarUpload(initialAvatarUrl);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = await upload(file);
    if (error) toast.error(error);
    else toast.success('Avatar updated');
    e.target.value = '';
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setIsPending(true);
    try {
      await updateProfile({ displayName, bio });
      toast.success('Profile updated');
      setOpen(false);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Edit Profile
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4">
          {/* Avatar */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile picture"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="edit-avatar-upload"
                  className="text-sm text-primary underline cursor-pointer hover:opacity-70 transition-opacity"
                >
                  {isUploading ? 'Uploading…' : 'Change photo'}
                </label>
                <input
                  id="edit-avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={isUploading}
                  onChange={handleAvatarChange}
                />
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={remove}
                    disabled={isUploading}
                    className="text-sm text-destructive underline text-left hover:opacity-70 transition-opacity disabled:opacity-40"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="displayName" className="text-sm font-medium text-foreground">
              Display Name
            </label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              maxLength={64}
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bio" className="text-sm font-medium text-foreground">
              Bio
            </label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself"
              maxLength={280}
              rows={4}
            />
          </div>
        </form>
        <SheetFooter>
          <Button
            type="submit"
            disabled={isPending || isUploading}
            onClick={handleSubmit}
            className="w-full"
          >
            {isPending ? <Spinner className="mr-2" /> : null}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(frontend)/profile/[username]/_components/EditProfileSheet.tsx
git commit -m "feat: add avatar section to EditProfileSheet"
```

---

## Task 15: Update ProfileHeader and Wire Everything

**Files:**
- Modify: `src/app/(frontend)/profile/[username]/_components/ProfileHeader.tsx`
- Modify: `src/app/(frontend)/profile/[username]/page.tsx`
- Modify: `src/app/(frontend)/account/_components/AccountPage.tsx`

`ProfileHeader` becomes `'use client'` because it holds the `FollowersSheet` open state and composes multiple Client Component children.

Note: `ProfileHeader` is the only consumer of `getUserProfile` data on the profile page. The local `getUserProfile` function defined inside `profile/[username]/page.tsx` should be kept as-is — it handles the 404 edge case and is server-only. The exported `getUserProfile` from `services/users.ts` is available for other uses (e.g., search, admin).

- [ ] **Step 1: Replace ProfileHeader**

Replace the full contents of `src/app/(frontend)/profile/[username]/_components/ProfileHeader.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';

import { Card, CardContent } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { UserProfile } from '@/types/user';

import AvatarUploader from './AvatarUploader';
import EditProfileSheet from './EditProfileSheet';
import FollowButton from './FollowButton';
import FollowersSheet from './FollowersSheet';

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwner: boolean;
  isAuthenticated: boolean;
}

export default function ProfileHeader({
  profile,
  isOwner,
  isAuthenticated,
}: ProfileHeaderProps) {
  const [followersSheetType, setFollowersSheetType] = useState<
    'followers' | 'following' | null
  >(null);

  const joinedDate = profile.joinedAt
    ? format(new Date(profile.joinedAt), 'MMM yyyy')
    : null;

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-4">
          {/* Avatar + identity */}
          <div className="flex items-center gap-4">
            <AvatarUploader
              initialAvatarUrl={profile.avatarUrl}
              isOwner={isOwner}
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">
                {profile.displayName ?? profile.username}
              </h1>
              {profile.displayName && (
                <p className="text-sm text-muted-foreground">
                  @{profile.username}
                </p>
              )}
              {joinedDate && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Joined {joinedDate}
                </p>
              )}
            </div>
            {isOwner && (
              <EditProfileSheet
                initialDisplayName={profile.displayName ?? ''}
                initialBio={profile.bio ?? ''}
                initialAvatarUrl={profile.avatarUrl}
              />
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-foreground leading-relaxed">
              {profile.bio}
            </p>
          )}

          <Separator />

          {/* Stats strip */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex flex-col items-center">
              <span className="font-semibold text-foreground">{profile.totalPolls}</span>
              <span className="text-muted-foreground text-xs">Polls</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold text-foreground">{profile.totalVotes}</span>
              <span className="text-muted-foreground text-xs">Votes</span>
            </div>

            {/* FollowButton owns followers count + follow toggle so they update together */}
            {!isOwner && isAuthenticated ? (
              <FollowButton
                username={profile.username}
                initialIsFollowing={profile.isFollowing ?? false}
                initialFollowersCount={profile.followersCount}
                onOpenFollowers={() => setFollowersSheetType('followers')}
              />
            ) : (
              <button
                type="button"
                onClick={() => setFollowersSheetType('followers')}
                className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
              >
                <span className="font-semibold text-foreground">{profile.followersCount}</span>
                <span className="text-muted-foreground text-xs">Followers</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setFollowersSheetType('following')}
              className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
            >
              <span className="font-semibold text-foreground">{profile.followingCount}</span>
              <span className="text-muted-foreground text-xs">Following</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <FollowersSheet
        username={profile.username}
        type={followersSheetType ?? 'followers'}
        open={followersSheetType !== null}
        onOpenChange={(open) => {
          if (!open) setFollowersSheetType(null);
        }}
      />
    </>
  );
}
```

- [ ] **Step 2: Update profile page — add isAuthenticated**

In `src/app/(frontend)/profile/[username]/page.tsx`, change the JSX:

```tsx
// Before:
const isOwner = session?.username === username || session?.nickName === username;
// ...
<ProfileHeader profile={profile} isOwner={isOwner} />

// After:
const isOwner = session?.username === username || session?.nickName === username;
const isAuthenticated = !!session;
// ...
<ProfileHeader profile={profile} isOwner={isOwner} isAuthenticated={isAuthenticated} />
```

- [ ] **Step 3: Update AccountPage — add isAuthenticated**

In `src/app/(frontend)/account/_components/AccountPage.tsx`, update the `ProfileHeader` call:

```tsx
// Before:
<ProfileHeader profile={profile} isOwner={true} />

// After:
<ProfileHeader profile={profile} isOwner={true} isAuthenticated={true} />
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 5: Run full test suite**

```bash
npm run test
```
Expected: all PASS

- [ ] **Step 6: Lint**

```bash
npm run lint
```
Fix any errors or warnings before committing.

- [ ] **Step 7: Commit**

```bash
git add src/app/(frontend)/profile/[username]/_components/ProfileHeader.tsx \
        src/app/(frontend)/profile/[username]/page.tsx \
        src/app/(frontend)/account/_components/AccountPage.tsx
git commit -m "feat: wire avatar uploader and follow system into ProfileHeader"
```

---

## Final Verification

- [ ] Confirm `API_URL=http://localhost:3000` in `.env.local`
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to `/profile/alice` — confirm `followersCount`, `followingCount` display
- [ ] Click "Followers" or "Following" count — `FollowersSheet` opens with seeded data
- [ ] On own profile (logged in): click avatar → file picker opens; upload a JPEG → avatar updates immediately
- [ ] On own profile: open Edit Profile sheet → avatar section visible at top
- [ ] On another user's profile (logged in): Follow button appears; click Follow → count increments optimistically
- [ ] Click Unfollow → count decrements
- [ ] Run `npm run test` — all PASS
- [ ] Run `npx tsc --noEmit` — 0 errors
- [ ] Run `npm run lint` — 0 warnings
- [ ] Run `npm run generate:openapi` to capture new routes in the OpenAPI spec (requires live DB — skip if unavailable)

```bash
git add -A
git commit -m "feat: avatar upload and follow system complete"
```
