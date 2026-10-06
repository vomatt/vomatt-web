'use server';

import { updateTag } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';

import { getTokens } from '@/lib/api/auth';
import { ApiError, apiClient, AuthError, publicFetch } from '@/lib/api/client';
import { cursorPageSchema } from '@/lib/api/cursor';

import { FEED_TAG, pollTag } from './cache';
import type { ActionFailure, ActionResult } from './errors';
import {
	type Poll,
	type PollInput,
	type PollResults,
	PollResultsSchema,
	PollSchema,
	UserVoteStatusSchema,
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
		voterVisibility: input.voterVisibility,
	});
}

// ── Reads ────────────────────────────────────────────────────────────────────

/**
 * Until backend 3 ships cursors, `cursor` is a Spring page number. Until it
 * returns `myOptionId`, a signed-in viewer's Ballots are looked up here, in
 * parallel, so the cards don't each make a sequential Server Action call.
 */
export async function getFeed(cursor?: string | null, size = 10, tag?: string) {
	const params = new URLSearchParams({ page: cursor ?? '0', size: String(size) });
	if (tag) params.set('tag', tag);
	const [data, tokens] = await Promise.all([
		publicFetch(`/votes?${params}`, { next: { tags: [FEED_TAG] } } as RequestInit),
		getTokens(),
	]);
	const page = PollPage.parse(data);
	if (!tokens) return page;

	const items = await Promise.all(
		page.items.map(async (poll) =>
			poll.myOptionId === undefined ? { ...poll, myOptionId: await getMyBallot(poll.id) } : poll
		)
	);
	return { ...page, items };
}

export async function getPollsByCreator(username: string): Promise<Poll[]> {
	try {
		const url = `/votes?creatorUsername=${encodeURIComponent(username)}`;
		const data = await publicFetch(url, { next: { revalidate: 60 } } as RequestInit);
		return PollPage.parse(data).items;
	} catch {
		return [];
	}
}

export async function getPoll(id: string): Promise<Poll | null> {
	try {
		const data = await publicFetch(`/votes/${id}`, {
			next: { revalidate: 30, tags: [pollTag(id)] },
		} as RequestInit);
		return PollSchema.parse(data);
	} catch (error) {
		if (error instanceof ApiError && error.statusCode === 404) return null;
		throw error;
	}
}

export async function getMyPolls() {
	return apiClient('/votes/my');
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
		updateTag(pollTag(pollId));
	});
}

/** Retraction: the voter is no longer a Participant and won't be notified. */
export async function retractBallot(pollId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${pollId}/vote`, { method: 'DELETE' });
		updateTag(pollTag(pollId));
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

export async function getComments(pollId: string, page = 0, size = 20) {
	const params = new URLSearchParams({
		page: String(page),
		size: String(size),
	});
	return apiClient(`/votes/${pollId}/comments?${params}`);
}

export async function postComment(pollId: string, text: string) {
	return apiClient(`/votes/${pollId}/comments`, {
		method: 'POST',
		body: JSON.stringify({ text }),
	});
}

export async function updateComment(
	voteId: string,
	commentId: string,
	text: string
) {
	return apiClient(`/votes/${voteId}/comments/${commentId}`, {
		method: 'PUT',
		body: JSON.stringify({ text }),
	});
}

export async function deleteComment(voteId: string, commentId: string) {
	return apiClient(`/votes/${voteId}/comments/${commentId}`, {
		method: 'DELETE',
	});
}

export async function likeComment(voteId: string, commentId: string) {
	return apiClient(`/votes/${voteId}/comments/${commentId}/like`, {
		method: 'POST',
	});
}

export async function unlikeComment(voteId: string, commentId: string) {
	return apiClient(`/votes/${voteId}/comments/${commentId}/like`, {
		method: 'DELETE',
	});
}
