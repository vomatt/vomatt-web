'use server';

import { revalidateTag, updateTag } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';

import { apiClient, ApiError, AuthError, publicFetch } from '@/lib/api/client';
import {
	collectPages,
	type CursorPage,
	cursorPageSchema,
	MAX_PAGE_SIZE,
	pageParams,
} from '@/lib/api/cursor';

import { FEED_TAG, pollTag } from './cache';
import { SEARCH_MIN_LENGTH } from './constants';
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
	toApiVoterVisibility,
	UserVoteStatusSchema,
	type Voter,
	VoterSchema,
} from './schema';

const PollPage = cursorPageSchema(PollSchema);

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
		voterVisibility: toApiVoterVisibility(input.voterVisibility),
	});
}

// ── Reads ────────────────────────────────────────────────────────────────────

const CACHED_LIST = { next: { revalidate: 30, tags: [FEED_TAG] } } as RequestInit;

/**
 * `asViewer`: signed-in viewers get each Poll's `myOptionId` (apiClient keeps
 * those out of the shared cache). Lists that never show the viewer's Ballot
 * read the shared cached page.
 */
async function fetchPollPage(path: string, params: URLSearchParams, { asViewer = false } = {}) {
	const url = `${path}?${params}`;
	const data = asViewer
		? await apiClient(url, { auth: 'optional', ...CACHED_LIST })
		: await publicFetch(url, CACHED_LIST);
	return PollPage.parse(data);
}

/** `sort` applies to Open Polls only; Ended ones are always latest-ended first. */
export type PollListQuery = {
	status?: 'open' | 'ended';
	sort?: 'newest' | 'closing';
	/** Tag slug. */
	tag?: string;
	/** Matches titles and descriptions; ignored under 2 characters. */
	q?: string;
};

/**
 * Explore and Search, from the shared cache. Only Open or Ended Polls;
 * Scheduled ones are never listed.
 */
export async function getPolls(
	query: PollListQuery = {},
	cursor?: string | null,
	limit = 10,
	{ asViewer = false } = {}
): Promise<CursorPage<Poll>> {
	const params = pageParams(cursor, limit);
	if (query.status === 'ended') params.set('status', 'ended');
	else if (query.sort) params.set('sort', query.sort);
	if (query.tag) params.set('tag', query.tag);
	const q = query.q?.trim();
	if (q && q.length >= SEARCH_MIN_LENGTH) params.set('q', q);
	return fetchPollPage('/votes', params, { asViewer });
}

/** The home feed: Open Polls, most recently opened first, with the viewer's Ballots. */
export async function getFeed(cursor?: string | null, size = 10, tag?: string) {
	return getPolls({ tag }, cursor, size, { asViewer: true });
}

const TagPage = cursorPageSchema(TagDtoSchema);

/** Most-used topics first, for the feed's topic tabs. Empty when the API is down. */
export async function getPopularTags(size = 12): Promise<TagDto[]> {
	try {
		const data = await publicFetch(`/tags/popular?${pageParams(null, size)}`, {
			next: { revalidate: 300 },
		} as RequestInit);
		return TagPage.parse(data).items;
	} catch {
		return [];
	}
}

/** A user's opened Polls (Open and Ended), most recently opened first. */
export async function getUserPolls(
	username: string,
	cursor?: string | null,
	limit = 20
): Promise<CursorPage<Poll>> {
	return fetchPollPage(
		`/users/${encodeURIComponent(username)}/votes`,
		pageParams(cursor, limit)
	);
}

/**
 * The signed-in user's Polls. `open`: Scheduled and Open ones they created
 * plus Open ones they hold a Ballot in, closing soonest first. `ended`: Ended
 * and Cancelled ones of either kind, latest first, each with `unread`.
 */
export async function getMyPolls(
	status: 'open' | 'ended' = 'open',
	cursor?: string | null,
	limit = MAX_PAGE_SIZE
): Promise<CursorPage<Poll>> {
	const params = pageParams(cursor, limit);
	if (status === 'ended') params.set('status', 'ended');
	return PollPage.parse(await apiClient(`/votes/my?${params}`));
}

/** Enough for any real user; a cap so a runaway cursor can't loop forever. */
const MY_POLLS_MAX_PAGES = 10;

/** Every page of getMyPolls, for account insights that need the whole set. */
export async function getAllMyPolls(status: 'open' | 'ended'): Promise<Poll[]> {
	const { items } = await collectPages((cursor) => getMyPolls(status, cursor), {
		maxPages: MY_POLLS_MAX_PAGES,
	});
	return items;
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

const VoterPage = cursorPageSchema(VoterSchema);

/**
 * Who chose what, oldest Ballot first. Ended Polls only, and only as far as
 * the Poll's Voter Visibility allows: 403 `vote.voters.hidden` otherwise.
 */
export async function getVoters(
	pollId: string,
	cursor?: string | null
): Promise<ActionResult<CursorPage<Voter>>> {
	return attempt(async () =>
		VoterPage.parse(await apiClient(`/votes/${pollId}/voters?${pageParams(cursor, MAX_PAGE_SIZE)}`))
	);
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

/** Retraction: the voter is no longer a Participant and won't be notified. Idempotent. */
export async function retractBallot(pollId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${pollId}/vote`, { method: 'DELETE' });
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

/** Top-level Comments, newest first. Public; signed in, `likedByCurrentUser` is set. */
export async function getComments(
	pollId: string,
	cursor?: string | null
): Promise<ActionResult<CursorPage<Comment>>> {
	return attempt(async () => {
		const params = pageParams(cursor, COMMENT_PAGE_SIZE);
		const data = await apiClient(`/votes/${pollId}/comments?${params}`, { auth: 'optional' });
		return CommentPage.parse(data);
	});
}

/** Replies to one top-level Comment, oldest first. */
export async function getReplies(
	pollId: string,
	commentId: string,
	cursor?: string | null
): Promise<ActionResult<CursorPage<Comment>>> {
	return attempt(async () => {
		const params = pageParams(cursor, COMMENT_PAGE_SIZE);
		const data = await apiClient(`/votes/${pollId}/comments/${commentId}/replies?${params}`, {
			auth: 'optional',
		});
		return CommentPage.parse(data);
	});
}

/** A top-level Comment, or a Reply when `parentId` is set (the API files it under the top-level one). */
export async function postComment(
	pollId: string,
	text: string,
	parentId?: string
): Promise<ActionResult<Comment>> {
	return attempt(async () =>
		CommentSchema.parse(
			await apiClient(`/votes/${pollId}/comments`, {
				method: 'POST',
				// JSON leaves out an undefined parentId
				body: JSON.stringify({ text, parentId }),
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
