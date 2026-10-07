'use server';

import { updateTag } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';

import { getUserSession } from '@/data/auth';
import { apiClient, ApiError, AuthError, publicFetch } from '@/lib/api/client';
import { type CursorPage, cursorPageSchema } from '@/lib/api/cursor';

import { FEED_TAG, pollTag } from './cache';
import type { ActionFailure, ActionResult } from './errors';
import {
	type Comment,
	CommentSchema,
	type Poll,
	type PollInput,
	type PollResults,
	PollResultsSchema,
	PollSchema,
	type TagDto,
	TagDtoSchema,
	UserVoteStatusSchema,
} from './schema';

const PollPage = cursorPageSchema(PollSchema);
const MAX_FEED_PAGE_SIZE = 50;

function toFailure(error: unknown): ActionFailure {
	unstable_rethrow(error);
	if (error instanceof ApiError) {
		return {
			ok: false,
			status: error.statusCode,
			errorCode: error.data?.errorCode,
			message: error.message,
		};
	}
	if (error instanceof AuthError) {
		return { ok: false, status: error.statusCode, message: error.message };
	}
	return { ok: false, message: error instanceof Error ? error.message : 'Request failed' };
}

/** Runs a request as a Server Action result: never throws, except Next's redirects. */
async function attempt<T>(request: () => Promise<T>): Promise<ActionResult<T>> {
	try {
		return { ok: true, data: await request() };
	} catch (error) {
		return toFailure(error);
	}
}

function toRequestBody(input: PollInput) {
	return JSON.stringify({
		title: input.title,
		description: input.description,
		options: input.options.map((option, i) => ({ text: option.text, displayOrder: i })),
		startTime: input.startTime,
		endTime: input.endTime,
		allowMultipleChoices: false,
		anonymous: input.voterVisibility === 'nobody',
		voterVisibility: input.voterVisibility,
	});
}

// ── Reads ────────────────────────────────────────────────────────────────────

/**
 * Fills in a signed-in viewer's Ballot until backend 3 returns `myOptionId`
 * on the Poll. Delete this, and its two callers' use of it, once it does.
 */
async function withMyBallot(poll: Poll): Promise<Poll> {
	if (poll.myOptionId !== undefined) return poll;
	return { ...poll, myOptionId: await getMyBallot(poll.id) };
}

/**
 * Until backend 3 ships cursors, `cursor` is a 1-based page number. Ballots
 * are looked up here, in parallel, so the cards don't each make a sequential
 * Server Action call.
 */
export async function getFeed(cursor?: string | null, size = 10, tag?: string) {
	// Callable from any client, and each item costs a Ballot lookup, so cap the page
	const pageSize = Math.min(Math.max(1, size), MAX_FEED_PAGE_SIZE);
	const params = new URLSearchParams({ page: cursor ?? '1', size: String(pageSize) });
	if (tag) params.set('tag', tag);
	const [data, session] = await Promise.all([
		publicFetch(`/votes?${params}`, { next: { revalidate: 30, tags: [FEED_TAG] } } as RequestInit),
		getUserSession(),
	]);
	const page = PollPage.parse(data);
	if (!session) return page;
	return { ...page, items: await Promise.all(page.items.map(withMyBallot)) };
}

const TagPage = cursorPageSchema(TagDtoSchema);

/** Most-used topics first, for the feed's topic tabs. Empty when the API is down. */
export async function getPopularTags(size = 12): Promise<TagDto[]> {
	try {
		const data = await publicFetch(`/tags/popular?page=1&size=${size}`, {
			next: { revalidate: 300 },
		} as RequestInit);
		return TagPage.parse(data).items;
	} catch {
		return [];
	}
}

/**
 * The API can't filter by creator yet, so this filters the newest polls.
 * Older polls by the creator are missed until it can.
 */
export async function getPollsByCreator(username: string): Promise<Poll[]> {
	try {
		const params = new URLSearchParams({ page: '1', size: String(MAX_FEED_PAGE_SIZE) });
		const data = await publicFetch(`/votes?${params}`, {
			next: { revalidate: 60, tags: [FEED_TAG] },
		} as RequestInit);
		return PollPage.parse(data).items.filter((poll) => poll.creatorUsername === username);
	} catch {
		return [];
	}
}

/**
 * Null when the Poll doesn't exist. The API only serves single Polls to
 * signed-in users today, so a signed-out request rejects with a 401 ApiError.
 */
export async function getPoll(id: string): Promise<Poll | null> {
	try {
		const session = await getUserSession();
		const data = session
			? await apiClient(`/votes/${encodeURIComponent(id)}`, { cache: 'no-store' })
			: await publicFetch(`/votes/${encodeURIComponent(id)}`, {
					next: { revalidate: 30, tags: [pollTag(id)] },
				} as RequestInit);
		return PollSchema.parse(data);
	} catch (error) {
		if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 400)) {
			return null;
		}
		throw error;
	}
}

/** The Poll with the signed-in viewer's Ballot, for server-rendered pages. */
export async function getPollForViewer(id: string): Promise<Poll | null> {
	const [poll, session] = await Promise.all([getPoll(id), getUserSession()]);
	return poll && session ? withMyBallot(poll) : poll;
}

/** Polls the signed-in user created, newest first. */
export async function getMyPolls(): Promise<Poll[]> {
	const params = new URLSearchParams({ page: '1', size: String(MAX_FEED_PAGE_SIZE) });
	return PollPage.parse(await apiClient(`/votes/my?${params}`)).items;
}

/**
 * The signed-in user's Ballot, or null. Remove once backend 3 returns
 * `myOptionId` on the Poll.
 */
export async function getMyBallot(pollId: string): Promise<string | null> {
	try {
		const data = await apiClient(`/votes/${pollId}/my-vote-status`);
		const status = UserVoteStatusSchema.parse(data);
		return status.hasVoted ? (status.selectedOptions?.[0] ?? null) : null;
	} catch (error) {
		unstable_rethrow(error);
		return null;
	}
}

/** Only for Ended Polls. A 403 means the results are still sealed. */
export async function getResults(pollId: string): Promise<ActionResult<PollResults>> {
	return attempt(async () =>
		PollResultsSchema.parse(await apiClient(`/votes/${pollId}/results`, { auth: 'optional' }))
	);
}

// ── Ballot ───────────────────────────────────────────────────────────────────

/** Casts a Ballot, or replaces the existing one. */
export async function castBallot(pollId: string, optionId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${pollId}/vote`, {
			method: 'POST',
			body: JSON.stringify({ optionIds: [optionId] }),
		});
		// Turnout shows in the feed too
		updateTag(pollTag(pollId));
		updateTag(FEED_TAG);
	});
}

/** Retraction: the voter is no longer a Participant and won't be notified. */
export async function retractBallot(pollId: string, optionId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${pollId}/vote/${optionId}`, { method: 'DELETE' });
		updateTag(pollTag(pollId));
		updateTag(FEED_TAG);
	});
}

// ── Owner ────────────────────────────────────────────────────────────────────

export async function createPoll(input: PollInput): Promise<ActionResult<Poll>> {
	return attempt(async () => {
		const poll = await apiClient<Poll>('/votes', { method: 'POST', body: toRequestBody(input) });
		updateTag(FEED_TAG);
		return poll;
	});
}

/** Owner only, and only while the Poll is Scheduled. */
export async function updatePoll(id: string, input: PollInput): Promise<ActionResult<Poll>> {
	return attempt(async () => {
		const poll = await apiClient<Poll>(`/votes/${id}`, {
			method: 'PUT',
			body: toRequestBody(input),
		});
		updateTag(pollTag(id));
		updateTag(FEED_TAG);
		return poll;
	});
}

/** Closes an Open Poll early, or cancels a Scheduled one (no one is notified). */
export async function closePoll(id: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${id}/deactivate`, { method: 'PUT' });
		updateTag(pollTag(id));
		updateTag(FEED_TAG);
	});
}

// ── Comments ─────────────────────────────────────────────────────────────────

const CommentPage = cursorPageSchema(CommentSchema);
const COMMENT_PAGE_SIZE = 20;

/** Newest first. The API only shows comments to signed-in users today: a 401 means "sign in to read". */
export async function getComments(
	pollId: string,
	cursor?: string | null
): Promise<ActionResult<CursorPage<Comment>>> {
	return attempt(async () => {
		const params = new URLSearchParams({
			page: cursor ?? '1',
			size: String(COMMENT_PAGE_SIZE),
			sort: 'createdAt,desc',
		});
		const data = await apiClient(`/votes/${pollId}/comments?${params}`, {
			auth: 'optional',
			cache: 'no-store',
		});
		return CommentPage.parse(data);
	});
}

export async function postComment(pollId: string, text: string): Promise<ActionResult<Comment>> {
	return attempt(async () =>
		CommentSchema.parse(
			await apiClient(`/votes/${pollId}/comments`, {
				method: 'POST',
				body: JSON.stringify({ text }),
			})
		)
	);
}

export async function updateComment(
	voteId: string,
	commentId: string,
	text: string
): Promise<ActionResult<Comment>> {
	return attempt(async () =>
		CommentSchema.parse(
			await apiClient(`/votes/${voteId}/comments/${commentId}`, {
				method: 'PUT',
				body: JSON.stringify({ text }),
			})
		)
	);
}

export async function deleteComment(voteId: string, commentId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${voteId}/comments/${commentId}`, {
			method: 'DELETE',
		});
	});
}

export async function likeComment(voteId: string, commentId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${voteId}/comments/${commentId}/like`, {
			method: 'POST',
		});
	});
}

export async function unlikeComment(voteId: string, commentId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${voteId}/comments/${commentId}/like`, {
			method: 'DELETE',
		});
	});
}
