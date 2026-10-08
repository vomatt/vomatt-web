'use server';

import { revalidateTag, updateTag } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';

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

const CACHED_LIST = { next: { revalidate: 30, tags: [FEED_TAG] } } as RequestInit;
const FIRST_FULL_PAGE = () => new URLSearchParams({ page: '1', size: String(MAX_FEED_PAGE_SIZE) });

/**
 * As the viewer when signed in, so each Poll carries `myOptionId` (apiClient
 * keeps those out of the shared cache). `publicList` is the cached, shared
 * page for lists that never show the viewer's Ballot.
 */
function fetchPollPage(params: URLSearchParams, { publicList = false } = {}) {
	const path = `/votes?${params}`;
	const request = publicList
		? publicFetch(path, CACHED_LIST)
		: apiClient(path, { auth: 'optional', ...CACHED_LIST });
	return request.then((data) => PollPage.parse(data));
}

/** Pages only the signed-in user can see (their polls, their ballots). */
async function fetchMyPolls(path: string): Promise<Poll[]> {
	return PollPage.parse(await apiClient(`${path}?${FIRST_FULL_PAGE()}`)).items;
}

/** Until backend 3 ships cursors, `cursor` is a 1-based page number. */
export async function getFeed(cursor?: string | null, size = 10, tag?: string) {
	// Callable from any client, so cap the page
	const pageSize = Math.min(Math.max(1, size), MAX_FEED_PAGE_SIZE);
	const params = new URLSearchParams({ page: cursor ?? '1', size: String(pageSize) });
	if (tag) params.set('tag', tag);
	return fetchPollPage(params);
}

/** The newest open polls, for lists that filter and sort them client-side. */
export async function getRecentPolls(): Promise<Poll[]> {
	return (await fetchPollPage(FIRST_FULL_PAGE(), { publicList: true })).items;
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

/** A user's polls, ended ones included, newest first. */
export async function getPollsByCreator(username: string): Promise<Poll[]> {
	try {
		const params = FIRST_FULL_PAGE();
		params.set('creatorUsername', username);
		return (await fetchPollPage(params, { publicList: true })).items;
	} catch {
		return [];
	}
}

/** Polls the signed-in user voted in, each with their `myOptionId`. */
export async function getParticipatedPolls(): Promise<Poll[]> {
	return fetchMyPolls('/votes/participated');
}

/** Null when the Poll doesn't exist. Signed-in viewers get their `myOptionId`. */
export async function getPoll(id: string): Promise<Poll | null> {
	try {
		const data = await apiClient(`/votes/${encodeURIComponent(id)}`, {
			auth: 'optional',
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

/** Polls the signed-in user created, newest first. */
export async function getMyPolls(): Promise<Poll[]> {
	return fetchMyPolls('/votes/my');
}

/**
 * The signed-in user's Ballot, or null. Only needed for a Poll loaded before
 * sign-in, which has no `myOptionId`.
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

/**
 * The Poll's cached copy (what guests see) is fresh on the next view.
 * `expire: 0` avoids updateTag's re-render of the current route in the action
 * response. Ballots leave the shared lists to their 30s revalidate (expiring
 * them on every vote would make the next guest wait for a full uncached list);
 * owner changes (`lists: true`) also expire them, so an edited or cancelled
 * poll doesn't linger in Explore, profiles and the guest feed.
 */
function invalidatePoll(id: string, { lists = false } = {}) {
	revalidateTag(pollTag(id), { expire: 0 });
	if (lists) revalidateTag(FEED_TAG, { expire: 0 });
}

/** Casts a Ballot, or replaces the existing one. */
export async function castBallot(pollId: string, optionId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${pollId}/vote`, {
			method: 'POST',
			body: JSON.stringify({ optionIds: [optionId] }),
		});
		invalidatePoll(pollId);
	});
}

/** Retraction: the voter is no longer a Participant and won't be notified. */
export async function retractBallot(pollId: string, optionId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${pollId}/vote/${optionId}`, { method: 'DELETE' });
		invalidatePoll(pollId);
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
		invalidatePoll(id, { lists: true });
		return poll;
	});
}

/** Closes an Open Poll early, or cancels a Scheduled one (no one is notified). */
export async function closePoll(id: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${id}/deactivate`, { method: 'PUT' });
		invalidatePoll(id, { lists: true });
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
		const data = await apiClient(`/votes/${pollId}/comments?${params}`, { auth: 'optional' });
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
