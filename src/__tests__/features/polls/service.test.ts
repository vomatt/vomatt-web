import { isPollEnded, isSealed } from '@/features/polls/errors';
import {
	addInvitees,
	castBallot,
	closePoll,
	createPoll,
	deleteComment,
	deletePoll,
	getAllMyPolls,
	getComments,
	getFeed,
	getInviteOnlyCreator,
	getInvitees,
	getMyBallot,
	getMyPolls,
	getPoll,
	getPolls,
	getReplies,
	getResults,
	getUserPolls,
	getVoters,
	likeComment,
	postComment,
	removeInvitee,
	retractBallot,
	unlikeComment,
	updateComment,
	updatePoll,
} from '@/features/polls/service';
import { apiClient, ApiError, AuthError, publicFetch } from '@/lib/api/client';

jest.mock('next/cache', () => ({ updateTag: jest.fn(), revalidateTag: jest.fn() }));
jest.mock('next/navigation', () => ({ unstable_rethrow: jest.fn() }));

jest.mock('@/lib/api/client', () => {
	class ApiError extends Error {
		constructor(
			message: string,
			public statusCode: number,
			public data?: any
		) {
			super(message);
		}
	}
	class AuthError extends Error {
		statusCode = 401;
	}
	return {
		apiClient: jest.fn(),
		publicFetch: jest.fn(),
		ApiError,
		AuthError,
		API_BASE_PATH: '/api/v1',
	};
});

const { updateTag, revalidateTag } = jest.requireMock('next/cache');
const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;
const mockPublicFetch = publicFetch as jest.MockedFunction<typeof publicFetch>;

/** An Ended Poll: counts are visible. */
const oldPoll = {
	success: true,
	errorCode: null,
	id: 'poll-1',
	title: 'Tabs or spaces?',
	description: '',
	creatorId: 'user-1',
	creatorUsername: 'klaus',
	startTime: '2026-10-01T09:00:00Z',
	endTime: '2026-10-07T14:00:00Z',
	allowMultipleChoices: false,
	createdAt: '2026-10-01T09:00:00Z',
	updatedAt: '2026-10-01T09:00:00Z',
	totalVotes: 3,
	options: [
		{ id: 'opt-1', text: 'Tabs', votes: 2 },
		{ id: 'opt-2', text: 'Spaces', votes: 1 },
	],
	active: true,
	anonymous: false,
	votingActive: true,
};

/** An Open Poll: counts are Sealed (null). */
const newPoll = {
	id: 'poll-2',
	title: 'Which day?',
	creatorId: 'user-1',
	creatorUsername: 'mei.lin',
	startTime: '2026-10-04T10:00:00+08:00',
	endTime: '2026-10-07T22:00:00+08:00',
	createdAt: '2026-10-04T10:00:00+08:00',
	options: [
		{ id: 'opt-fri', text: 'Friday', votes: null },
		{ id: 'opt-sun', text: 'Sunday', votes: null },
	],
	active: true,
	votingActive: true,
	participantCount: 128,
	myOptionId: 'opt-sun',
	voterVisibility: 'OWNER',
	unread: null,
};

const page = (items: unknown[], nextCursor: string | null = null) => ({ items, nextCursor });

const input = {
	title: 'Which day?',
	description: 'Pick one',
	options: [{ text: 'Friday' }, { text: 'Sunday' }],
	startTime: '2026-10-04T02:00:00.000Z',
	endTime: '2026-10-07T14:00:00.000Z',
	voterVisibility: 'nobody' as const,
};

beforeEach(() => {
	jest.clearAllMocks();
	mockApiClient.mockResolvedValue(undefined);
});

describe('getPoll()', () => {
	it('parses the current Poll shape', async () => {
		mockApiClient.mockResolvedValue(oldPoll);
		const poll = await getPoll('poll-1');
		expect(poll?.options[0].votes).toBe(2);
		expect(poll?.totalVotes).toBe(3);
		expect(poll).not.toHaveProperty('allowMultipleChoices');
	});

	it('parses the sealed Poll shape without counts', async () => {
		mockApiClient.mockResolvedValue(newPoll);
		const poll = await getPoll('poll-2');
		expect(poll?.options[0].votes).toBeUndefined();
		expect(poll?.participantCount).toBe(128);
		expect(poll?.myOptionId).toBe('opt-sun');
		expect(poll?.voterVisibility).toBe('owner');
	});

	it('parses Audience, Deadline, invitee count and deletable', async () => {
		mockApiClient.mockResolvedValue({
			...newPoll,
			audience: 'INVITE_ONLY',
			deadline: '2026-10-08T22:00:00+08:00',
			inviteeCount: 12,
			deletable: true,
		});
		const poll = await getPoll('poll-2');
		expect(poll).toMatchObject({
			audience: 'invite-only',
			deadline: '2026-10-08T22:00:00+08:00',
			inviteeCount: 12,
			deletable: true,
		});
	});

	it('asks with optional auth and the poll tag (apiClient skips the cache when signed in)', async () => {
		mockApiClient.mockResolvedValue(oldPoll);
		await getPoll('poll-1');
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1', {
			auth: 'optional',
			next: { revalidate: 30, tags: ['poll:poll-1'] },
		});
	});

	it('returns null on 404', async () => {
		mockApiClient.mockRejectedValue(new ApiError('Not found', 404));
		expect(await getPoll('missing')).toBeNull();
	});

	it('accepts the nulls the API sends for empty fields', async () => {
		mockApiClient.mockResolvedValue({
			...oldPoll,
			description: null,
			updatedAt: null,
			endTime: null,
			tags: null,
			options: oldPoll.options.map((option) => ({ ...option, description: null })),
		});
		expect((await getPoll('poll-1'))?.description).toBeNull();
	});

	it('rethrows a 401, which the page turns into a sign-in prompt', async () => {
		mockApiClient.mockRejectedValue(new ApiError('Unauthorized', 401));
		await expect(getPoll('poll-1')).rejects.toMatchObject({ statusCode: 401 });
	});
});

describe('getFeed()', () => {
	it('asks as the viewer (optional auth) for the first page by limit', async () => {
		mockApiClient.mockResolvedValue(page([oldPoll], 'c2'));
		const result = await getFeed();
		expect(result).toEqual({ items: [expect.objectContaining({ id: 'poll-1' })], nextCursor: 'c2' });
		expect(mockApiClient).toHaveBeenCalledWith('/votes?limit=10', {
			auth: 'optional',
			next: { revalidate: 30, tags: ['polls-feed'] },
		});
	});

	it('keeps the viewer\'s Ballot the API sends, without extra lookups', async () => {
		mockApiClient.mockResolvedValue(page([newPoll]));
		const result = await getFeed();
		expect(result.items[0].myOptionId).toBe('opt-sun');
		expect(mockApiClient).toHaveBeenCalledTimes(1);
	});

	it('caps the page size a client can ask for', async () => {
		mockApiClient.mockResolvedValue(page([]));
		await getFeed(null, 1000);
		expect(mockApiClient).toHaveBeenCalledWith('/votes?limit=50', expect.anything());
	});

	it('passes the cursor back and the topic', async () => {
		mockApiClient.mockResolvedValue(page([newPoll]));
		await getFeed('c2', 10, 'work');
		expect(mockApiClient).toHaveBeenCalledWith('/votes?limit=10&cursor=c2&tag=work', expect.anything());
	});
});

describe('getPolls()', () => {
	it('sends status, sort and search', async () => {
		mockPublicFetch.mockResolvedValue(page([]));
		await getPolls({ status: 'open', sort: 'closing', q: ' side project ' }, null, 20);
		expect(mockPublicFetch.mock.calls[0][0]).toBe('/votes?limit=20&sort=closing&q=side+project');
	});

	it('sends the top sort', async () => {
		mockPublicFetch.mockResolvedValue(page([]));
		await getPolls({ status: 'open', sort: 'top' });
		expect(mockPublicFetch.mock.calls[0][0]).toBe('/votes?limit=10&sort=top');
	});

	it('never sends sort with ended (the API rejects it)', async () => {
		mockPublicFetch.mockResolvedValue(page([]));
		await getPolls({ status: 'ended', sort: 'closing' });
		expect(mockPublicFetch.mock.calls[0][0]).toBe('/votes?limit=10&status=ended');
	});

	it('leaves out a search shorter than 2 characters', async () => {
		mockPublicFetch.mockResolvedValue(page([]));
		await getPolls({ q: 'a' });
		expect(mockPublicFetch.mock.calls[0][0]).toBe('/votes?limit=10');
	});
});

describe('getUserPolls()', () => {
	it('reads the user\'s opened polls from the shared cache', async () => {
		mockPublicFetch.mockResolvedValue(page([oldPoll], 'n'));
		const result = await getUserPolls('mei lin');
		expect(result.items).toHaveLength(1);
		expect(mockPublicFetch.mock.calls[0][0]).toBe('/users/mei%20lin/votes?limit=20');
		expect(mockApiClient).not.toHaveBeenCalled();
	});
});

describe('getMyPolls()', () => {
	it('reads open polls by default', async () => {
		mockApiClient.mockResolvedValue(page([newPoll]));
		const result = await getMyPolls();
		expect(result.items[0].myOptionId).toBe('opt-sun');
		expect(mockApiClient).toHaveBeenCalledWith('/votes/my?limit=50');
	});

	it('reads ended polls with their unread flag', async () => {
		mockApiClient.mockResolvedValue(page([{ ...oldPoll, unread: true }]));
		const result = await getMyPolls('ended', 'c1', 20);
		expect(result.items[0].unread).toBe(true);
		expect(mockApiClient).toHaveBeenCalledWith('/votes/my?limit=20&cursor=c1&status=ended');
	});
});

describe('getAllMyPolls()', () => {
	it('follows the cursor until the last page', async () => {
		mockApiClient
			.mockResolvedValueOnce(page([oldPoll], 'c2'))
			.mockResolvedValueOnce(page([{ ...oldPoll, id: 'poll-9' }]));
		const polls = await getAllMyPolls('ended');
		expect(polls.map((p) => p.id)).toEqual(['poll-1', 'poll-9']);
		expect(mockApiClient).toHaveBeenLastCalledWith('/votes/my?limit=50&cursor=c2&status=ended');
	});

	it('stops after 10 pages even if the cursor never ends', async () => {
		mockApiClient.mockResolvedValue(page([oldPoll], 'again'));
		expect(await getAllMyPolls('open')).toHaveLength(10);
		expect(mockApiClient).toHaveBeenCalledTimes(10);
	});
});

describe('getVoters()', () => {
	it('parses the voter page', async () => {
		mockApiClient.mockResolvedValue(
			page([{ userId: 'u1', username: 'mei', optionId: 'opt-1', votedAt: '2026-10-01T09:00:00Z' }])
		);
		const result = await getVoters('poll-1');
		expect(result.ok && result.data.items[0].username).toBe('mei');
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1/voters?limit=50');
	});

	it('returns the hidden errorCode without throwing', async () => {
		mockApiClient.mockRejectedValue(new ApiError('Hidden', 403, { errorCode: 'vote.voters.hidden' }));
		expect(await getVoters('poll-1')).toMatchObject({ ok: false, errorCode: 'vote.voters.hidden' });
	});
});

describe('getMyBallot()', () => {
	it('returns the first selected option for a returning voter', async () => {
		mockApiClient.mockResolvedValue({ hasVoted: true, selectedOptions: ['opt-2'] });
		expect(await getMyBallot('poll-1')).toBe('opt-2');
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1/my-vote-status');
	});

	it('returns null when the user has not voted', async () => {
		mockApiClient.mockResolvedValue({ hasVoted: false, selectedOptions: [] });
		expect(await getMyBallot('poll-1')).toBeNull();
	});

	it('returns null when signed out', async () => {
		mockApiClient.mockRejectedValue(new AuthError('Not authenticated'));
		expect(await getMyBallot('poll-1')).toBeNull();
	});
});

describe('castBallot()', () => {
	it('sends a single option and invalidates the poll', async () => {
		mockApiClient.mockResolvedValue(newPoll);
		const result = await castBallot('poll-1', 'opt-1');
		expect(result).toEqual({ ok: true, data: expect.objectContaining({ id: 'poll-2' }) });
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1/vote', {
			method: 'POST',
			body: JSON.stringify({ optionIds: ['opt-1'] }),
		});
		expect(revalidateTag).toHaveBeenCalledWith('poll:poll-1', { expire: 0 });
	});

	it('sends whether the Ballot is Anonymous when given', async () => {
		mockApiClient.mockResolvedValue(newPoll);
		await castBallot('poll-1', 'opt-1', true);
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1/vote', {
			method: 'POST',
			body: JSON.stringify({ optionIds: ['opt-1'], anonymous: true }),
		});
	});

	it('does not read vote.not_allowed (not open yet) as ended', async () => {
		mockApiClient.mockRejectedValue(
			new ApiError('Not open', 400, { errorCode: 'vote.not_allowed' })
		);
		expect(isPollEnded(await castBallot('poll-1', 'opt-1'))).toBe(false);
	});

	it('reports vote.ended without throwing', async () => {
		mockApiClient.mockRejectedValue(
			new ApiError('Poll ended', 409, { errorCode: 'vote.ended' })
		);
		const result = await castBallot('poll-1', 'opt-1');
		expect(result.ok).toBe(false);
		expect(isPollEnded(result)).toBe(true);
		expect(revalidateTag).not.toHaveBeenCalled();
	});
});

describe('retractBallot()', () => {
	it('sends DELETE to /votes/{id}/vote', async () => {
		await retractBallot('poll-1');
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1/vote', { method: 'DELETE' });
		expect(revalidateTag).toHaveBeenCalledWith('poll:poll-1', { expire: 0 });
		// The shared feed keeps its own revalidate instead of expiring on every ballot
		expect(revalidateTag).not.toHaveBeenCalledWith('polls-feed', expect.anything());
	});
});

describe('getResults()', () => {
	it('parses results for an Ended Poll', async () => {
		mockApiClient.mockResolvedValue({
			id: 'poll-1',
			totalParticipants: 3,
			options: [{ id: 'opt-1', text: 'Tabs', voteCount: 2, percentage: 66.7 }],
		});
		const result = await getResults('poll-1');
		expect(result.ok && result.data.options[0].voteCount).toBe(2);
	});

	it('treats 403 as sealed', async () => {
		mockApiClient.mockRejectedValue(new ApiError('Forbidden', 403));
		expect(isSealed(await getResults('poll-1'))).toBe(true);
	});

	it('works for signed-out viewers too', async () => {
		mockApiClient.mockResolvedValue({ id: 'poll-1', options: [] });
		await getResults('poll-1');
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1/results', { auth: 'optional' });
	});
});

describe('createPoll() and updatePoll()', () => {
	it('never sends multi-choice and sends visibility in the API\'s spelling', async () => {
		await createPoll(input);
		const [url, init] = mockApiClient.mock.calls[0];
		expect(url).toBe('/votes');
		expect(JSON.parse(init!.body as string)).toEqual({
			title: 'Which day?',
			description: 'Pick one',
			options: [
				{ text: 'Friday', displayOrder: 0 },
				{ text: 'Sunday', displayOrder: 1 },
			],
			startTime: '2026-10-04T02:00:00.000Z',
			endTime: '2026-10-07T14:00:00.000Z',
			allowMultipleChoices: false,
			voterVisibility: 'NOBODY',
		});
		expect(updateTag).toHaveBeenCalledWith('polls-feed');
	});

	it('sends the Audience in the API\'s spelling, without Invitee lists', async () => {
		await createPoll({
			...input,
			audience: 'unlisted',
			invitees: { userIds: ['u1'], emails: [], inviteListIds: [] },
		});
		const body = JSON.parse(mockApiClient.mock.calls[0][1]!.body as string);
		expect(body.audience).toBe('UNLISTED');
		expect(body).not.toHaveProperty('inviteeIds');
		expect(body).not.toHaveProperty('inviteListIds');
	});

	it('sends users, emails and Groups for an Invite-only Poll', async () => {
		await createPoll({
			...input,
			audience: 'invite-only',
			invitees: { userIds: ['u1'], emails: ['carol@example.com'], inviteListIds: ['g1'] },
		});
		expect(JSON.parse(mockApiClient.mock.calls[0][1]!.body as string)).toMatchObject({
			audience: 'INVITE_ONLY',
			inviteeIds: ['u1'],
			inviteeEmails: ['carol@example.com'],
			inviteListIds: ['g1'],
		});
	});

	it('leaves the Audience out when none is given', async () => {
		await updatePoll('poll-1', input);
		expect(JSON.parse(mockApiClient.mock.calls[0][1]!.body as string)).not.toHaveProperty('audience');
	});

	it('updates a Scheduled Poll with PUT', async () => {
		await updatePoll('poll-1', { ...input, voterVisibility: 'owner' });
		const [url, init] = mockApiClient.mock.calls[0];
		expect(url).toBe('/votes/poll-1');
		expect(init!.method).toBe('PUT');
		expect(JSON.parse(init!.body as string)).toMatchObject({ voterVisibility: 'OWNER' });
		expect(JSON.parse(init!.body as string)).not.toHaveProperty('anonymous');
		expect(revalidateTag).toHaveBeenCalledWith('poll:poll-1', { expire: 0 });
		expect(revalidateTag).toHaveBeenCalledWith('polls-feed', { expire: 0 });
	});

	it('returns the failure message', async () => {
		mockApiClient.mockRejectedValue(new ApiError('Title too long', 400));
		expect(await createPoll(input)).toEqual({
			ok: false,
			status: 400,
			errorCode: undefined,
			message: 'Title too long',
		});
	});
});

describe('closePoll()', () => {
	it('sends PUT to /votes/{id}/deactivate', async () => {
		await closePoll('poll-1');
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1/deactivate', { method: 'PUT' });
		expect(revalidateTag).toHaveBeenCalledWith('poll:poll-1', { expire: 0 });
		expect(revalidateTag).toHaveBeenCalledWith('polls-feed', { expire: 0 });
	});
});

describe('deletePoll()', () => {
	it('sends DELETE to /votes/{id} and expires the lists', async () => {
		expect(await deletePoll('poll-1')).toEqual({ ok: true, data: undefined });
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1', { method: 'DELETE' });
		expect(revalidateTag).toHaveBeenCalledWith('poll:poll-1', { expire: 0 });
		expect(revalidateTag).toHaveBeenCalledWith('polls-feed', { expire: 0 });
	});

	it('reports a passed delete window', async () => {
		mockApiClient.mockRejectedValue(
			new ApiError('Too late', 400, { errorCode: 'vote.delete.window_passed' })
		);
		expect(await deletePoll('poll-1')).toMatchObject({
			ok: false,
			errorCode: 'vote.delete.window_passed',
		});
	});
});

describe('Invitees', () => {
	const invitees = [
		{ userId: 'u1', username: 'bob', email: null, hasBallot: true, invitedAt: '2026-10-09T15:20:31+08:00' },
		{ userId: null, username: null, email: 'dave@example.com', hasBallot: false, invitedAt: '2026-10-09T15:20:31+08:00' },
	];

	it('lists them', async () => {
		mockApiClient.mockResolvedValue(invitees);
		const result = await getInvitees('poll-1');
		expect(result.ok && result.data).toHaveLength(2);
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1/invitees');
	});

	it('adds users, emails and Groups and returns the full list', async () => {
		mockApiClient.mockResolvedValue(invitees);
		const result = await addInvitees('poll-1', { userIds: ['u1'], emails: ['dave@example.com'], inviteListIds: [] });
		expect(result.ok && result.data[1].email).toBe('dave@example.com');
		const [url, init] = mockApiClient.mock.calls[0];
		expect(url).toBe('/votes/poll-1/invitees');
		expect(init!.method).toBe('POST');
		expect(JSON.parse(init!.body as string)).toEqual({
			userIds: ['u1'],
			emails: ['dave@example.com'],
			inviteListIds: [],
		});
	});

	it('removes one added by ID by path', async () => {
		mockApiClient.mockResolvedValue([]);
		await removeInvitee('poll-1', { userId: 'u1', email: null });
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1/invitees/u1', { method: 'DELETE' });
	});

	it('removes one added by email by query', async () => {
		mockApiClient.mockResolvedValue([]);
		await removeInvitee('poll-1', { userId: null, email: 'dave+x@example.com' });
		expect(mockApiClient).toHaveBeenCalledWith(
			'/votes/poll-1/invitees?email=dave%2Bx%40example.com',
			{ method: 'DELETE' }
		);
	});
});

describe('updateComment()', () => {
	it('sends PUT to /votes/{voteId}/comments/{commentId}', async () => {
		await updateComment('vote-1', 'comment-1', 'edited text');
		expect(mockApiClient).toHaveBeenCalledWith(
			'/votes/vote-1/comments/comment-1',
			{
				method: 'PUT',
				body: JSON.stringify({ text: 'edited text' }),
			}
		);
	});
});

describe('deleteComment()', () => {
	it('sends DELETE to /votes/{voteId}/comments/{commentId}', async () => {
		await deleteComment('vote-1', 'comment-1');
		expect(mockApiClient).toHaveBeenCalledWith(
			'/votes/vote-1/comments/comment-1',
			{ method: 'DELETE' }
		);
	});
});

describe('likeComment()', () => {
	it('sends POST to /votes/{voteId}/comments/{commentId}/like', async () => {
		await likeComment('vote-1', 'comment-1');
		expect(mockApiClient).toHaveBeenCalledWith(
			'/votes/vote-1/comments/comment-1/like',
			{ method: 'POST' }
		);
	});
});

describe('unlikeComment()', () => {
	it('sends DELETE to /votes/{voteId}/comments/{commentId}/like', async () => {
		await unlikeComment('vote-1', 'comment-1');
		expect(mockApiClient).toHaveBeenCalledWith(
			'/votes/vote-1/comments/comment-1/like',
			{ method: 'DELETE' }
		);
	});
});

describe('getComments() and getReplies()', () => {
	const comment = {
		id: 'c1',
		voteId: 'poll-1',
		userId: 'u1',
		author: 'mei',
		text: 'Friday!',
		createdAt: '2026-10-04T10:00:00+08:00',
		updatedAt: '2026-10-04T10:00:00+08:00',
		likeCount: 0,
		likedByCurrentUser: false,
		edited: false,
		deleted: false,
		parentId: null,
		replyCount: 2,
	};

	it('reads top-level comments by cursor', async () => {
		mockApiClient.mockResolvedValue(page([comment], 'n1'));
		const result = await getComments('poll-1', 'c0');
		expect(result).toEqual({ ok: true, data: { items: [comment], nextCursor: 'n1' } });
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1/comments?limit=20&cursor=c0', {
			auth: 'optional',
		});
	});

	it('keeps each comment\'s reply previews and the cursor to the rest', async () => {
		const preview = { ...comment, id: 'r1', parentId: 'c1', replyCount: 0, replies: [], repliesNextCursor: null };
		mockApiClient.mockResolvedValue(page([{ ...comment, replies: [preview], repliesNextCursor: 'after-r1' }]));
		const result = await getComments('poll-1');
		expect(result.ok && result.data.items[0]).toMatchObject({
			replies: [{ id: 'r1', parentId: 'c1' }],
			repliesNextCursor: 'after-r1',
		});
	});

	it('parses a deleted placeholder', async () => {
		mockApiClient.mockResolvedValue(
			page([{ ...comment, deleted: true, author: null, text: null, userId: null }])
		);
		const result = await getComments('poll-1');
		expect(result.ok && result.data.items[0]).toMatchObject({ deleted: true, author: null });
	});

	it('reads replies of one comment', async () => {
		mockApiClient.mockResolvedValue(page([{ ...comment, id: 'r1', parentId: 'c1', replyCount: 0 }]));
		await getReplies('poll-1', 'c1');
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1/comments/c1/replies?limit=20', {
			auth: 'optional',
		});
	});
});

describe('postComment()', () => {
	it('sends a reply with its parent', async () => {
		mockApiClient.mockResolvedValue({
			id: 'r1',
			author: 'mei',
			text: 'Agreed',
			createdAt: '2026-10-04T10:00:00+08:00',
			parentId: 'c1',
		});
		await postComment('poll-1', 'Agreed', 'c1');
		expect(JSON.parse(mockApiClient.mock.calls[0][1]!.body as string)).toEqual({
			text: 'Agreed',
			parentId: 'c1',
		});
	});
});

describe('getInviteOnlyCreator()', () => {
	it("returns the owner of an Invite-only Poll from the public endpoint", async () => {
		mockPublicFetch.mockResolvedValue({ username: 'alice', avatarUrl: 'bot:boba' });
		expect(await getInviteOnlyCreator('poll-1')).toEqual({ username: 'alice', avatarUrl: 'bot:boba' });
		expect(mockPublicFetch).toHaveBeenCalledWith('/votes/poll-1/creator');
	});

	it('returns null when it is no Invite-only Poll', async () => {
		mockPublicFetch.mockRejectedValue(new ApiError('Not found', 404, { errorCode: 'vote.not_found' }));
		expect(await getInviteOnlyCreator('poll-1')).toBeNull();
	});

	it('returns null for an ID the API rejects, like getPoll does', async () => {
		mockPublicFetch.mockRejectedValue(new ApiError('Bad request', 400, { errorCode: 'common.validation_failed' }));
		expect(await getInviteOnlyCreator('abc')).toBeNull();
	});
});
