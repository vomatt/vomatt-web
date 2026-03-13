# API Endpoint Modules Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Next.js Route Handlers with Server Actions and endpoint modules, eliminating the unnecessary proxy layer between the frontend and the external backend API.

**Architecture:** Extract backend calls into `src/lib/api/endpoints/` as Server Actions (`'use server'`), callable directly from Server Components and Client Components. Read operations (getPolls, getPoll, etc.) are called directly from Server Components. Mutation operations (auth, vote, comment, create poll, profile update) are called as Server Actions from Client Components. All Route Handlers in `src/app/api/` get deleted.

**Tech Stack:** Next.js App Router Server Actions, TypeScript, existing `apiClient` from `src/lib/api/client.ts`, `cookies()` from `next/headers` (already used by `setAuthTokens`)

---

## File Map

**Create:**
- `src/lib/api/mock/polls.ts` — mock data (moved from route handler folder)
- `src/lib/api/endpoints/polls.ts` — all poll functions + Server Actions
- `src/lib/api/endpoints/auth.ts` — auth Server Actions (login, signup, preSignup, getVerifyCode)
- `src/lib/api/endpoints/users.ts` — user Server Actions (updateProfile)
- `src/app/(frontend)/my-polls/_components/MyPollsTabs.tsx` — client tab UI (split from page)

**Modify:**
- `src/app/(frontend)/login/_component/LogIn.tsx`
- `src/app/(frontend)/signup/_component/SignUp.tsx`
- `src/app/(frontend)/_components/PollCard.tsx`
- `src/components/PollCreator.tsx`
- `src/app/(frontend)/profile/[username]/_components/EditProfileSheet.tsx`
- `src/app/(frontend)/my-polls/page.tsx` — convert to Server Component
- `src/app/(frontend)/page.tsx` — update import

**Delete:**
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/login/getVerifyCode.ts`
- `src/app/api/auth/signup/route.ts`
- `src/app/api/auth/pre-signup/route.ts`
- `src/app/api/get-polls/route.ts`
- `src/app/api/get-polls/getPollsData.ts`
- `src/app/api/get-polls/mockData.ts`
- `src/app/api/get-poll/[id]/route.ts`
- `src/app/api/my-polls/route.ts`
- `src/app/api/search-polls/route.ts`
- `src/app/api/create-poll/route.ts`
- `src/app/api/vote/route.ts`
- `src/app/api/comment/route.ts`
- `src/app/api/user/profile/route.ts`
- `src/app/api/save-draft/route.ts`

---

## Chunk 1: Create endpoint modules and mock data

### Task 1: Move mock data to lib

**Files:**
- Create: `src/lib/api/mock/polls.ts`

- [ ] **Step 1: Create `src/lib/api/mock/polls.ts`**

Copy verbatim from `src/app/api/get-polls/mockData.ts` — only the import path changes:

```ts
import { Poll } from '@/types/poll';

const now = new Date();
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();

export const mockPolls: Poll[] = [
	{
		id: 'mock-1',
		title: 'Which programming language should we adopt for our next project?',
		description:
			'We are planning a new microservice and need to decide on the primary language. Your input will help the team align on the best choice.',
		active: true,
		votingActive: true,
		allowMultipleChoices: false,
		anonymous: false,
		creatorId: 'user-1',
		creatorUsername: 'alex_dev',
		createdAt: ago(15),
		updatedAt: ago(15),
		startTime: ago(15),
		endTime: null,
		totalVotes: 142,
		success: true,
		errorCode: null,
		options: [
			{ id: 'opt-1-1', text: 'TypeScript', votes: 68 },
			{ id: 'opt-1-2', text: 'Go', votes: 41 },
			{ id: 'opt-1-3', text: 'Rust', votes: 22 },
			{ id: 'opt-1-4', text: 'Python', votes: 11 },
		],
		comments: [
			{ id: 'c-1-1', author: 'sarah_k', text: 'TypeScript is already our frontend stack, makes sense to unify.', createdAt: ago(10) },
			{ id: 'c-1-2', author: 'mike_infra', text: 'Go performs really well for services that need low latency.', createdAt: ago(5) },
		],
	},
	{
		id: 'mock-2',
		title: 'When should we hold the next team retrospective?',
		description: '',
		active: true,
		votingActive: true,
		allowMultipleChoices: false,
		anonymous: true,
		creatorId: 'user-2',
		creatorUsername: 'priya_pm',
		createdAt: ago(60),
		updatedAt: ago(60),
		startTime: ago(60),
		endTime: null,
		totalVotes: 87,
		success: true,
		errorCode: null,
		options: [
			{ id: 'opt-2-1', text: 'This Friday afternoon', votes: 34 },
			{ id: 'opt-2-2', text: 'Next Monday morning', votes: 29 },
			{ id: 'opt-2-3', text: 'Next Wednesday at noon', votes: 24 },
		],
		comments: [],
	},
	{
		id: 'mock-3',
		title: 'Should we switch our daily standup to async?',
		description: 'With the team spanning multiple timezones, a text-based async standup via Slack might work better than a live call.',
		active: true,
		votingActive: true,
		allowMultipleChoices: false,
		anonymous: false,
		creatorId: 'user-3',
		creatorUsername: 'james_eng',
		createdAt: ago(120),
		updatedAt: ago(90),
		startTime: ago(120),
		endTime: null,
		totalVotes: 53,
		success: true,
		errorCode: null,
		options: [
			{ id: 'opt-3-1', text: 'Yes, go fully async', votes: 31 },
			{ id: 'opt-3-2', text: 'No, keep the live call', votes: 14 },
			{ id: 'opt-3-3', text: 'Hybrid — async with optional call', votes: 8 },
		],
		comments: [
			{ id: 'c-3-1', author: 'lin_design', text: 'Async works great for our Berlin team members.', createdAt: ago(100) },
		],
	},
	{
		id: 'mock-4',
		title: 'What should the theme of our next team offsite be?',
		description: "We have budget approved for a 2-day offsite. Vote for the theme you'd enjoy most.",
		active: true,
		votingActive: true,
		allowMultipleChoices: true,
		anonymous: false,
		creatorId: 'user-4',
		creatorUsername: 'nina_hr',
		createdAt: ago(300),
		updatedAt: ago(200),
		startTime: ago(300),
		endTime: ago(-2880),
		totalVotes: 210,
		success: true,
		errorCode: null,
		options: [
			{ id: 'opt-4-1', text: 'Hackathon & innovation sprint', votes: 72 },
			{ id: 'opt-4-2', text: 'Outdoor adventure & team building', votes: 65 },
			{ id: 'opt-4-3', text: 'Strategy & roadmap planning', votes: 48 },
			{ id: 'opt-4-4', text: 'Workshop & skill sharing', votes: 25 },
		],
		comments: [
			{ id: 'c-4-1', author: 'tom_fe', text: 'Hackathon all the way! We build great things under pressure.', createdAt: ago(280) },
			{ id: 'c-4-2', author: 'priya_pm', text: 'Would be great to combine hackathon with some planning sessions.', createdAt: ago(250) },
			{ id: 'c-4-3', author: 'alex_dev', text: 'Outdoor activities really help with bonding, especially for new members.', createdAt: ago(180) },
		],
	},
	{
		id: 'mock-5',
		title: 'Which UI component library should replace our current setup?',
		description: '',
		active: true,
		votingActive: true,
		allowMultipleChoices: false,
		anonymous: false,
		creatorId: 'user-5',
		creatorUsername: 'lin_design',
		createdAt: ago(480),
		updatedAt: ago(480),
		startTime: ago(480),
		endTime: null,
		totalVotes: 38,
		success: true,
		errorCode: null,
		options: [
			{ id: 'opt-5-1', text: 'Shadcn/ui (current direction)', votes: 18 },
			{ id: 'opt-5-2', text: 'Radix UI primitives only', votes: 10 },
			{ id: 'opt-5-3', text: 'Mantine', votes: 6 },
			{ id: 'opt-5-4', text: 'Chakra UI', votes: 4 },
		],
		comments: [],
	},
];

export const mockPollsPage = {
	content: mockPolls,
	empty: false,
	first: true,
	last: true,
	number: 0,
	numberOfElements: mockPolls.length,
	size: 20,
	totalElements: mockPolls.length,
	totalPages: 1,
	pageable: {
		pageNumber: 0,
		pageSize: 20,
		offset: 0,
		paged: true,
		unpaged: false,
		sort: { sorted: false, unsorted: true, empty: true },
	},
	sort: { sorted: false, unsorted: true, empty: true },
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/mock/polls.ts
git commit -m "feat: move poll mock data to lib/api/mock/polls.ts"
```

---

### Task 2: Create polls endpoint module

**Files:**
- Create: `src/lib/api/endpoints/polls.ts`

- [ ] **Step 1: Create `src/lib/api/endpoints/polls.ts`**

```ts
'use server';

import { ApiError, apiClient } from '@/lib/api/client';
import { mockPolls, mockPollsPage } from '@/lib/api/mock/polls';
import { PollCreatorData } from '@/types/poll';

export async function getPolls(page = 0) {
	try {
		const res = await fetch(`${process.env.API_URL}/api/v1/votes?page=${page}`);
		const { success, data } = await res.json();
		if (success) return data;
	} catch {}
	return mockPollsPage;
}

export async function getPoll(id: string) {
	try {
		const res = await fetch(`${process.env.API_URL}/api/v1/votes/${id}`);
		const { success, data } = await res.json();
		if (success) return data;
	} catch {}
	return mockPolls.find((p) => p.id === id) ?? null;
}

export async function searchPolls({
	q = '',
	page = '0',
	sort = 'newest',
	status = 'all',
}: {
	q?: string;
	page?: string;
	sort?: string;
	status?: string;
} = {}) {
	try {
		const params = new URLSearchParams({ page, sort, status });
		if (q) params.set('q', q);
		const res = await fetch(`${process.env.API_URL}/api/v1/votes?${params}`);
		const { success, data } = await res.json();
		if (success) return data;
	} catch {}
	const lower = q.toLowerCase();
	const filtered = lower
		? mockPolls.filter(
				(p) =>
					p.title.toLowerCase().includes(lower) ||
					p.description?.toLowerCase().includes(lower)
			)
		: mockPolls;
	return { ...mockPollsPage, content: filtered, totalElements: filtered.length };
}

export async function getMyPolls() {
	try {
		return await apiClient('/api/v1/votes/my');
	} catch (error) {
		if (error instanceof ApiError && error.statusCode !== 404) throw error;
		return mockPollsPage;
	}
}

export async function createPoll(data: PollCreatorData) {
	const response = await apiClient('/api/v1/votes', {
		method: 'POST',
		body: JSON.stringify({
			title: data.question,
			description: data.description,
			options: data.options,
			startTime: data.startTime,
			endTime: data.endTime,
			allowMultipleChoices: data.isAllowMultipleChoices,
			anonymous: data.isAnonymous,
		}),
	});
	const { success, errorCode, data: pollData } = response || {};
	if (!success) return { status: 'ERROR' as const, message: errorCode };
	return { status: 'SUCCESS' as const, data: pollData };
}

export async function vote(pollId: string, optionId: string) {
	return apiClient(`/api/v1/votes/${pollId}/options/${optionId}`, { method: 'POST' });
}

export async function getComments(pollId: string) {
	return apiClient(`/api/v1/votes/${pollId}/comments`);
}

export async function postComment(pollId: string, text: string) {
	return apiClient(`/api/v1/votes/${pollId}/comments`, {
		method: 'POST',
		body: JSON.stringify({ text }),
	});
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/endpoints/polls.ts
git commit -m "feat: add polls endpoint module with Server Actions"
```

---

### Task 3: Create auth endpoint module

**Files:**
- Create: `src/lib/api/endpoints/auth.ts`

- [ ] **Step 1: Create `src/lib/api/endpoints/auth.ts`**

```ts
'use server';

import { setAuthTokens } from '@/lib/api/auth';

export async function getVerifyCode(email: string) {
	try {
		const res = await fetch(
			`${process.env.API_URL}/api/auth/generateVerificationCode?email=${email}`
		);
		const data = await res.json();
		const { success, errorCode } = data;
		if (!success) return { status: 'ERROR' as const, message: errorCode };
		return { status: 'SUCCESS' as const };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return { status: 'ERROR' as const, message };
	}
}

export async function login(email: string, verificationCode: string) {
	try {
		const res = await fetch(`${process.env.API_URL}/api/auth/signin`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, verificationCode }),
		});
		const data = await res.json();
		const { success, errorCode, token, refreshToken } = data || {};
		if (success && token) {
			await setAuthTokens({ accessToken: token, refreshToken });
			return { status: 'SUCCESS' as const };
		}
		return { status: 'ERROR' as const, message: errorCode };
	} catch {
		return { status: 'ERROR' as const, message: 'Something went wrong' };
	}
}

export async function preSignup(email: string, username: string) {
	try {
		const res = await fetch(`${process.env.API_URL}/api/auth/pre-signup`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, username }),
		});
		const data = await res.json();
		const { success, message } = data || {};
		if (success) return { status: 'SUCCESS' as const };
		return { status: 'ERROR' as const, message };
	} catch {
		return { status: 'ERROR' as const, message: 'Something went wrong, please try again later' };
	}
}

export async function signup(data: {
	email: string;
	firstName: string;
	lastName: string;
	username: string;
	verificationCode: string;
}) {
	try {
		const res = await fetch(`${process.env.API_URL}/api/auth/signup`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		const resData = await res.json();
		const { success, errorCode, token, refreshToken } = resData || {};
		if (success) {
			await setAuthTokens({ accessToken: token, refreshToken });
			return { status: 'SUCCESS' as const };
		}
		return { status: 'ERROR' as const, message: errorCode };
	} catch {
		return { status: 'ERROR' as const, message: 'Something went wrong, please try again later' };
	}
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/endpoints/auth.ts
git commit -m "feat: add auth endpoint module with Server Actions"
```

---

### Task 4: Create users endpoint module

**Files:**
- Create: `src/lib/api/endpoints/users.ts`

- [ ] **Step 1: Create `src/lib/api/endpoints/users.ts`**

```ts
'use server';

import { apiClient } from '@/lib/api/client';

export async function updateProfile(data: { displayName?: string; bio?: string }) {
	return apiClient('/api/v1/users/me', {
		method: 'PATCH',
		body: JSON.stringify(data),
	});
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/endpoints/users.ts
git commit -m "feat: add users endpoint module with Server Actions"
```

---

## Chunk 2: Update callers

### Task 5: Update LogIn.tsx

**Files:**
- Modify: `src/app/(frontend)/login/_component/LogIn.tsx`

- [ ] **Step 1: Replace import**

Replace:
```ts
import { getVerifyCode } from '@/app/api/auth/login/getVerifyCode';
```
With:
```ts
import { getVerifyCode, login } from '@/lib/api/endpoints/auth';
```

- [ ] **Step 2: Replace `onSubmitLogin` body**

Replace the entire `onSubmitLogin` function:
```ts
const onSubmitLogin = async (pin: string) => {
	const bodyData = {
		email,
		verificationCode: pin,
	};

	try {
		const res = await fetch('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify(bodyData),
		});
		const data = await res.json();
		const apiStatus = data?.status;
		const apiMessage = data?.message as string | undefined;

		if (apiStatus === 'SUCCESS') {
			return { status: 'OK' as const };
		}

		return {
			status: 'ERROR' as const,
			message: apiMessage || 'Login failed',
		};
	} catch (error) {
		return {
			status: 'ERROR' as const,
			message: 'Something went wrong, pleas try again later',
		};
	}
};
```
With:
```ts
const onSubmitLogin = async (pin: string) => {
	try {
		const result = await login(email, pin);
		if (result.status === 'SUCCESS') return { status: 'OK' as const };
		return { status: 'ERROR' as const, message: result.message || 'Login failed' };
	} catch {
		return { status: 'ERROR' as const, message: 'Something went wrong, please try again later' };
	}
};
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(frontend)/login/_component/LogIn.tsx
git commit -m "feat: replace login fetch with Server Action"
```

---

### Task 6: Update SignUp.tsx

**Files:**
- Modify: `src/app/(frontend)/signup/_component/SignUp.tsx`

- [ ] **Step 1: Add import at top of file**

Add after existing imports:
```ts
import { preSignup, signup } from '@/lib/api/endpoints/auth';
```

- [ ] **Step 2: Replace `onSubmitSignUp` body**

Replace the entire `onSubmitSignUp` function:
```ts
const onSubmitSignUp = async (pin: string) => {
	const bodyData = {
		...formData,
		verificationCode: pin,
	};

	try {
		const res = await fetch('/api/auth/signup', {
			method: 'POST',
			body: JSON.stringify(bodyData),
		});
		const data = await res.json();
		const apiStatus = data?.status;
		const apiMessage = data?.message as string | undefined;

		if (apiStatus === 'SUCCESS') {
			return { status: 'OK' as const };
		}

		return {
			status: 'ERROR' as const,
			message: apiMessage || 'Verification failed',
		};
	} catch (error) {
		return {
			status: 'ERROR' as const,
			message: 'Something went wrong, pleas try again later',
		};
	}
};
```
With:
```ts
const onSubmitSignUp = async (pin: string) => {
	try {
		const result = await signup({ ...formData, verificationCode: pin });
		if (result.status === 'SUCCESS') return { status: 'OK' as const };
		return { status: 'ERROR' as const, message: result.message || 'Verification failed' };
	} catch {
		return { status: 'ERROR' as const, message: 'Something went wrong, please try again later' };
	}
};
```

- [ ] **Step 3: Replace pre-signup fetch in `onSubmit`**

Replace:
```ts
const response = await fetch('/api/auth/pre-signup', {
	method: 'POST',
	body: JSON.stringify(data),
});

const resData = await response.json();

if (resData.status === 'ERROR') {
	setError(resData.message);
	return;
}
```
With:
```ts
const resData = await preSignup(data.email, data.username);

if (resData.status === 'ERROR') {
	setError(resData.message ?? '');
	return;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/app/(frontend)/signup/_component/SignUp.tsx
git commit -m "feat: replace signup fetch calls with Server Actions"
```

---

### Task 7: Update PollCard.tsx

**Files:**
- Modify: `src/app/(frontend)/_components/PollCard.tsx`

- [ ] **Step 1: Add import**

Add after existing imports:
```ts
import { vote as castVote, postComment } from '@/lib/api/endpoints/polls';
```

- [ ] **Step 2: Replace `handleVote` fetch**

Replace:
```ts
await fetch('/api/vote', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ pollId, optionId }),
});
```
With:
```ts
await castVote(pollId, optionId);
```

- [ ] **Step 3: Replace `handleComment` fetch**

Replace:
```ts
await fetch('/api/comment', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ pollId, text }),
});
```
With:
```ts
await postComment(pollId, text);
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/app/(frontend)/_components/PollCard.tsx
git commit -m "feat: replace vote/comment fetches with Server Actions"
```

---

### Task 8: Update PollCreator.tsx

**Files:**
- Modify: `src/components/PollCreator.tsx`

- [ ] **Step 1: Add import**

Add after existing imports:
```ts
import { createPoll } from '@/lib/api/endpoints/polls';
```

- [ ] **Step 2: Replace `handleCreatePoll` fetch**

Replace:
```ts
const response = await fetch('/api/create-poll', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(body),
});
const data = await response.json();

if (data?.status === 'SUCCESS') {
	resetForm();
	setOpen(false);
	return;
}

setError(data?.message);
```
With:
```ts
const data = await createPoll(body);

if (data?.status === 'SUCCESS') {
	resetForm();
	setOpen(false);
	return;
}

setError(data?.message ?? 'error');
```

- [ ] **Step 3: Remove save-draft fetch call**

In `handleSaveDraft`, remove the entire second `try` block that calls `/api/save-draft` (the localStorage block above it already handles persistence):

Remove:
```ts
try {
	await fetch('/api/save-draft', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(draft),
	});
} catch {
	// Local save is the primary fallback
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/PollCreator.tsx
git commit -m "feat: replace create-poll fetch with Server Action, drop save-draft route call"
```

---

### Task 9: Update EditProfileSheet.tsx

**Files:**
- Modify: `src/app/(frontend)/profile/[username]/_components/EditProfileSheet.tsx`

- [ ] **Step 1: Add import**

Add after existing imports:
```ts
import { updateProfile } from '@/lib/api/endpoints/users';
```

- [ ] **Step 2: Replace `handleSubmit` body**

Replace:
```ts
const res = await fetch('/api/user/profile', {
	method: 'PATCH',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ displayName, bio }),
});
if (!res.ok) throw new Error('Failed to save');
toast.success('Profile updated');
setOpen(false);
```
With:
```ts
await updateProfile({ displayName, bio });
toast.success('Profile updated');
setOpen(false);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(frontend)/profile/[username]/_components/EditProfileSheet.tsx
git commit -m "feat: replace profile update fetch with Server Action"
```

---

### Task 10: Convert my-polls page to Server Component

**Files:**
- Create: `src/app/(frontend)/my-polls/_components/MyPollsTabs.tsx`
- Modify: `src/app/(frontend)/my-polls/page.tsx`

- [ ] **Step 1: Create `MyPollsTabs.tsx` with all tab/row logic**

```tsx
'use client';
import { formatDistance } from 'date-fns';
import { enUS } from 'date-fns/locale';
import Link from 'next/link';
import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';
import { Poll } from '@/types/poll';

type Tab = 'active' | 'drafts' | 'ended';

function PollRow({ poll }: { poll: Poll }) {
	const isActive = poll.active && poll.votingActive;
	return (
		<div className="group flex items-start justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-200">
			<div className="flex-1 min-w-0">
				<Link href={`/poll/${poll.id}`}>
					<p className="font-display text-lg leading-snug text-foreground group-hover:text-foreground/80 transition-colors truncate">
						{poll.title}
					</p>
				</Link>
				<p className="font-data text-xs text-muted-foreground mt-1.5 tabular-nums">
					{poll.totalVotes.toLocaleString()} votes ·{' '}
					{formatDistance(new Date(poll.createdAt), new Date(), { locale: enUS })} ago
				</p>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<span
					className={cn(
						'text-xs px-2.5 py-0.5 rounded-full font-medium border',
						isActive
							? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
							: 'border-border/50 text-muted-foreground bg-muted/30'
					)}
				>
					{isActive ? 'Active' : 'Ended'}
				</span>
			</div>
		</div>
	);
}

export default function MyPollsTabs({ polls }: { polls: Poll[] }) {
	const [activeTab, setActiveTab] = useState<Tab>('active');

	const activePolls = polls.filter((p) => p.active && p.votingActive);
	const endedPolls = polls.filter((p) => !p.active || !p.votingActive);

	const tabContent: Record<Tab, Poll[]> = {
		active: activePolls,
		drafts: [],
		ended: endedPolls,
	};

	return (
		<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
			<TabsList className="mb-4">
				<TabsTrigger value="active">Active ({activePolls.length})</TabsTrigger>
				<TabsTrigger value="drafts">Drafts</TabsTrigger>
				<TabsTrigger value="ended">Ended ({endedPolls.length})</TabsTrigger>
			</TabsList>

			{(['active', 'drafts', 'ended'] as Tab[]).map((tab) => (
				<TabsContent key={tab} value={tab} className="space-y-3">
					{tabContent[tab].length === 0 ? (
						<p className="text-muted-foreground text-center py-8">No polls here yet.</p>
					) : (
						tabContent[tab].map((poll) => <PollRow key={poll.id} poll={poll} />)
					)}
				</TabsContent>
			))}
		</Tabs>
	);
}
```

- [ ] **Step 2: Replace `page.tsx` with Server Component**

Replace entire file content with:
```tsx
import { getMyPolls } from '@/lib/api/endpoints/polls';

import MyPollsTabs from './_components/MyPollsTabs';

export default async function MyPollsPage() {
	const data = await getMyPolls();
	const polls = data?.content ?? [];

	return (
		<div className="px-contain max-w-2xl mx-auto py-6">
			<h1 className="font-display text-4xl text-foreground mb-6">My Polls</h1>
			<MyPollsTabs polls={polls} />
		</div>
	);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(frontend)/my-polls/page.tsx src/app/(frontend)/my-polls/_components/MyPollsTabs.tsx
git commit -m "feat: convert my-polls to Server Component, extract MyPollsTabs client"
```

---

### Task 11: Update home page import

**Files:**
- Modify: `src/app/(frontend)/page.tsx`

- [ ] **Step 1: Replace import**

Replace:
```ts
import { getPollsData } from '@/app/api/get-polls/getPollsData';
```
With:
```ts
import { getPolls } from '@/lib/api/endpoints/polls';
```

- [ ] **Step 2: Update usage**

Replace:
```ts
const [user, data] = await Promise.all([getUserSession(), getPollsData()]);
```
With:
```ts
const [user, data] = await Promise.all([getUserSession(), getPolls()]);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(frontend)/page.tsx
git commit -m "feat: update home page to use getPolls endpoint module"
```

---

## Chunk 3: Delete old Route Handlers

### Task 12: Delete all replaced Route Handlers

- [ ] **Step 1: Delete auth route handlers**

```bash
rm src/app/api/auth/login/route.ts
rm src/app/api/auth/login/getVerifyCode.ts
rm src/app/api/auth/signup/route.ts
rm src/app/api/auth/pre-signup/route.ts
```

- [ ] **Step 2: Delete poll route handlers and utilities**

```bash
rm src/app/api/get-polls/route.ts
rm src/app/api/get-polls/getPollsData.ts
rm src/app/api/get-polls/mockData.ts
rm src/app/api/get-poll/[id]/route.ts
rm src/app/api/my-polls/route.ts
rm src/app/api/search-polls/route.ts
rm src/app/api/create-poll/route.ts
```

- [ ] **Step 3: Delete interaction and user route handlers**

```bash
rm src/app/api/vote/route.ts
rm src/app/api/comment/route.ts
rm src/app/api/user/profile/route.ts
rm src/app/api/save-draft/route.ts
```

- [ ] **Step 4: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```
Expected: No errors — no remaining imports reference the deleted files

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete all replaced Route Handlers and old API utilities"
```
