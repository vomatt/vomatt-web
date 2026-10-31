'use server';

import { revalidateTag, updateTag } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';

import { attempt } from '@/lib/api/action';
import { apiClient, ApiError, publicFetch } from '@/lib/api/client';
import {
	collectPages,
	type CursorPage,
	cursorPageSchema,
	MAX_PAGE_SIZE,
	pageParams,
} from '@/lib/api/cursor';

import { FEED_TAG, pollTag } from './cache';
import { SEARCH_MIN_LENGTH } from './constants';
import type { ActionResult } from './errors';
import { personPath } from './invitees';
import {
	type Comment,
	CommentSchema,
	type Invitee,
	InviteeSchema,
	type InviteesInput,
	type Poll,
	type PollInput,
	type PollResults,
	PollResultsSchema,
	PollSchema,
	type ReportCommentRequest,
	type ReportPollRequest,
	type TagDto,
	TagDtoSchema,
	type ThreadComment,
	ThreadCommentSchema,
	toApiAudience,
	toApiVoterVisibility,
	UserVoteStatusSchema,
	type Voter,
	VoterSchema,
} from './schema';

const PollPage = cursorPageSchema(PollSchema);

function toRequestBody(input: PollInput) {
	return JSON.stringify({
		title: input.title,
		description: input.description,
		options: input.options.map((option, i) => ({ text: option.text, displayOrder: i })),
		startTime: input.startTime,
		endTime: input.endTime,
		allowMultipleChoices: false,
		voterVisibility: toApiVoterVisibility(input.voterVisibility),
		audience: input.audience && toApiAudience(input.audience),
		// Other Audiences send no lists: the API rejects them, and switching away removes the Invitees
		...(input.audience === 'invite-only' &&
			input.invitees && {
				inviteeIds: input.invitees.userIds,
				inviteeEmails: input.invitees.emails,
				inviteListIds: input.invitees.inviteListIds,
			}),
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

/**
 * `sort` applies to Open Polls only; Ended ones are always latest-ended first.
 * `top` is most Turnout first.
 */
export type PollListQuery = {
	status?: 'open' | 'ended';
	sort?: 'newest' | 'closing' | 'top';
	/** Tag slug. */
	tag?: string;
	/** Matches titles and descriptions; ignored under 2 characters. */
	q?: string;
};

/**
 * Explore, Search and the home feed. Only Open or Ended Polls; Scheduled ones are
 * never listed. Lists drawn as ballot cards pass `asViewer` so each shows the viewer's vote.
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

/**
 * Open public Polls by people the viewer follows, most recently opened first.
 * Per viewer, so never from the shared cache; sign-in required.
 */
export async function getFollowingFeed(cursor?: string | null, size = 10) {
	return PollPage.parse(await apiClient(`/votes/following?${pageParams(cursor, size)}`));
}

/** The viewer's bookmarked Polls, most recently bookmarked first, in any state. Sign-in required. */
export async function getBookmarkedPolls(cursor?: string | null, size = 10) {
	return PollPage.parse(await apiClient(`/votes/bookmarked?${pageParams(cursor, size)}`));
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

/** Every topic, most used first, for Explore's topic search. Empty when the API is down. */
export async function getTags(): Promise<TagDto[]> {
	try {
		const data = await publicFetch('/tags', { next: { revalidate: 300 } } as RequestInit);
		// The API sends display order; sorted once here, not on every keystroke
		return z.array(TagDtoSchema).parse(data).sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0));
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
 * The signed-in user's Polls: ones they created, hold a Ballot in or are an
 * Invitee of. `open`: Scheduled and Open, closing soonest first, each with
 * `unread` for an Invitation. `ended`: Ended (and old Cancelled) ones, latest
 * first, each with `unread` for the Ended Notification.
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
 * The owner of an Invite-only Poll, for an Invitation link the viewer can't
 * open yet (signed out, or not the invited account). Null for any other Poll.
 */
export async function getInviteOnlyCreator(
	pollId: string
): Promise<{ username: string; avatarUrl: string | null } | null> {
	try {
		return await publicFetch(`/votes/${encodeURIComponent(pollId)}/creator`);
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
 * Revalidating also evicts the browser's back/forward cache, so going back to a
 * list shows the new Turnout and comment count, and makes the action's response
 * re-render the current route. Ballots and Comments leave the shared lists to
 * their 30s revalidate (expiring them on every vote would make the next guest
 * wait for a full uncached list); owner changes (`lists: true`) also expire them,
 * so an edited, ended or deleted poll doesn't linger in Explore, profiles and
 * the guest feed.
 */
function invalidatePoll(id: string, { lists = false } = {}) {
	revalidateTag(pollTag(id), { expire: 0 });
	if (lists) revalidateTag(FEED_TAG, { expire: 0 });
}

/**
 * Casts a Ballot, or replaces the existing one. Resolves to the Poll, which
 * has already Ended when this was the last Invitee's Ballot of an Invite-only Poll.
 */
export async function castBallot(
	pollId: string,
	optionId: string,
	/** Omitted keeps the current Ballot's flag, or the account default for a first Ballot. */
	anonymous?: boolean
): Promise<ActionResult<Poll>> {
	return attempt(async () => {
		const poll = await apiClient(`/votes/${pollId}/vote`, {
			method: 'POST',
			body: JSON.stringify({ optionIds: [optionId], anonymous }),
		});
		invalidatePoll(pollId);
		return PollSchema.parse(poll);
	});
}

/** Retraction: the voter is no longer a Participant and won't be notified. Idempotent. */
export async function retractBallot(pollId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${pollId}/vote`, { method: 'DELETE' });
		invalidatePoll(pollId);
	});
}

/** Where a Poll's link was shared, as the API names it. */
export type ShareChannel = 'COPY_LINK' | 'NATIVE' | 'LINE' | 'FACEBOOK' | 'X' | 'THREADS' | 'OTHER';

/**
 * Counts a signed-in user's share of a Poll (once per user and Poll; a repeat
 * keeps the first channel). Signed-out viewers aren't counted: they get a 401 failure.
 */
const ShareResult = z.object({ shareCount: z.number().int() });

export async function sharePoll(pollId: string, channel: ShareChannel): Promise<ActionResult<number>> {
	return attempt(async () => {
		const result = await apiClient(`/votes/${encodeURIComponent(pollId)}/share`, {
			method: 'POST',
			body: JSON.stringify({ channel }),
		});
		return ShareResult.parse(result).shareCount;
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

/**
 * Ends an Open Unlisted or Invite-only Poll now. A Public Poll runs to its
 * Deadline (400 `vote.close.public_not_allowed`); a Scheduled one is Deleted instead.
 */
export async function closePoll(id: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${id}/deactivate`, { method: 'PUT' });
		invalidatePoll(id, { lists: true });
	});
}

/**
 * Removes the Poll for everyone; nobody is notified. Only while Scheduled or
 * within the delete window after posting (the Poll's `deletable`).
 */
export async function deletePoll(id: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${id}`, { method: 'DELETE' });
		invalidatePoll(id, { lists: true });
	});
}

// ── Invitees (owner of an Invite-only Poll) ──────────────────────────────────

const InviteeList = z.array(InviteeSchema);

/** Every Invitee, each with `hasBallot`. */
export async function getInvitees(pollId: string): Promise<ActionResult<Invitee[]>> {
	return attempt(async () => InviteeList.parse(await apiClient(`/votes/${pollId}/invitees`)));
}

/**
 * Adds Invitees; ones already invited are ignored. Not once the Poll has
 * Ended. Resolves to the full list.
 */
export async function addInvitees(
	pollId: string,
	invitees: InviteesInput
): Promise<ActionResult<Invitee[]>> {
	return attempt(async () => {
		const list = await apiClient(`/votes/${pollId}/invitees`, {
			method: 'POST',
			body: JSON.stringify(invitees),
		});
		invalidatePoll(pollId);
		return InviteeList.parse(list);
	});
}

/**
 * Removes one Invitee, by user ID or by the email they were added by.
 * Refused (`vote.invitee.has_ballot`) once they hold a Ballot. Removing the
 * last Invitee without a Ballot Ends the Poll. Resolves to the full list.
 */
export async function removeInvitee(
	pollId: string,
	invitee: Pick<Invitee, 'userId' | 'email'>
): Promise<ActionResult<Invitee[]>> {
	return attempt(async () => {
		const list = await apiClient(personPath(`/votes/${pollId}/invitees`, invitee), {
			method: 'DELETE',
		});
		invalidatePoll(pollId);
		return InviteeList.parse(list);
	});
}

// ── Comments ─────────────────────────────────────────────────────────────────

const CommentPage = cursorPageSchema(CommentSchema);
const ThreadCommentPage = cursorPageSchema(ThreadCommentSchema);
const COMMENT_PAGE_SIZE = 20;

/** Top-level Comments, newest first, each with its first Replies. Public; signed in, `likedByCurrentUser` is set. */
export async function getComments(
	pollId: string,
	cursor?: string | null
): Promise<ActionResult<CursorPage<ThreadComment>>> {
	return attempt(async () => {
		const params = pageParams(cursor, COMMENT_PAGE_SIZE);
		const data = await apiClient(`/votes/${pollId}/comments?${params}`, { auth: 'optional' });
		return ThreadCommentPage.parse(data);
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
	return attempt(async () => {
		const comment = await apiClient(`/votes/${pollId}/comments`, {
			method: 'POST',
			// JSON leaves out an undefined parentId
			body: JSON.stringify({ text, parentId }),
		});
		invalidatePoll(pollId);
		return CommentSchema.parse(comment);
	});
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
		invalidatePoll(voteId);
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

/** Reports another person's Comment or Reply to the moderators; reporting it again keeps the first report. */
export async function reportComment(
	voteId: string,
	commentId: string,
	report: ReportCommentRequest
): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${voteId}/comments/${commentId}/report`, {
			method: 'POST',
			body: JSON.stringify(report),
		});
	});
}

/** Reports another person's Poll to the moderators; reporting it again keeps the first report. */
export async function reportPoll(voteId: string, report: ReportPollRequest): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${voteId}/report`, { method: 'POST', body: JSON.stringify(report) });
	});
}

/** Idempotent: bookmarking a bookmarked Poll keeps its first place in the list. */
export async function bookmarkPoll(voteId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${voteId}/bookmark`, { method: 'PUT' });
	});
}

/** Idempotent: succeeds when the Poll was not bookmarked. */
export async function unbookmarkPoll(voteId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/votes/${voteId}/bookmark`, { method: 'DELETE' });
	});
}

/** The viewer's followed tags, most recently followed first; not paginated. Sign-in required. */
export async function getFollowedTags(): Promise<ActionResult<TagDto[]>> {
	return attempt(async () => z.array(TagDtoSchema).parse(await apiClient('/tags/following')));
}

/** Idempotent: following a followed tag succeeds. Followed tags add their Open Polls to the Following feed. */
export async function followTag(tagId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/tags/${encodeURIComponent(tagId)}/follow`, { method: 'PUT' });
	});
}

/** Idempotent: succeeds when the tag was not followed. */
export async function unfollowTag(tagId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/tags/${encodeURIComponent(tagId)}/follow`, { method: 'DELETE' });
	});
}
