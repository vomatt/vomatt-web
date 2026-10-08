import { isPollEnded, isSealed } from '@/features/polls/errors';
import {
	castBallot,
	closePoll,
	createPoll,
	deleteComment,
	getFeed,
	getMyBallot,
	getParticipatedPolls,
	getPoll,
	getPollsByCreator,
	getResults,
	likeComment,
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

/** The Poll shape the API returns today. */
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

/** The sealed-ballot shape: no counts while Open. */
const newPoll = {
	id: 'poll-2',
	title: 'Which day?',
	creatorId: 'user-1',
	creatorUsername: 'mei.lin',
	startTime: '2026-10-04T10:00:00+08:00',
	endTime: '2026-10-07T22:00:00+08:00',
	createdAt: '2026-10-04T10:00:00+08:00',
	options: [
		{ id: 'opt-fri', text: 'Friday' },
		{ id: 'opt-sun', text: 'Sunday' },
	],
	active: true,
	votingActive: true,
	participantCount: 128,
	myOptionId: 'opt-sun',
	voterVisibility: 'owner',
};

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
	it('asks as the viewer (optional auth) and turns the next 1-based page into a cursor', async () => {
		mockApiClient.mockResolvedValue({ content: [oldPoll], total: 25, page: 1, limit: 10 });
		const page = await getFeed();
		expect(page.items).toHaveLength(1);
		expect(page.nextCursor).toBe('2');
		expect(mockApiClient).toHaveBeenCalledWith('/votes?page=1&size=10', {
			auth: 'optional',
			next: { revalidate: 30, tags: ['polls-feed'] },
		});
	});

	it('keeps the viewer\'s Ballot the API sends, without extra lookups', async () => {
		mockApiClient.mockResolvedValue({ content: [newPoll], total: 1, page: 1, limit: 10 });
		const page = await getFeed();
		expect(page.items[0].myOptionId).toBe('opt-sun');
		expect(mockApiClient).toHaveBeenCalledTimes(1);
	});

	it('caps the page size a client can ask for', async () => {
		mockApiClient.mockResolvedValue({ content: [], total: 0, page: 1, limit: 50 });
		await getFeed(null, 1000);
		expect(mockApiClient).toHaveBeenCalledWith('/votes?page=1&size=50', expect.anything());
	});

	it('passes the topic', async () => {
		mockApiClient.mockResolvedValue({ items: [newPoll], nextCursor: null });
		await getFeed('2', 10, 'work');
		expect(mockApiClient).toHaveBeenCalledWith('/votes?page=2&size=10&tag=work', expect.anything());
	});
});

describe('getPollsByCreator()', () => {
	it('asks the API for that creator\'s polls', async () => {
		mockApiClient.mockResolvedValue({ content: [oldPoll], total: 1, page: 1, limit: 50 });
		expect(await getPollsByCreator('mei')).toHaveLength(1);
		expect(mockApiClient.mock.calls[0][0]).toBe('/votes?creatorUsername=mei&page=1&size=50');
	});

	it('is empty when the API fails', async () => {
		mockApiClient.mockRejectedValue(new ApiError('down', 503));
		expect(await getPollsByCreator('mei')).toEqual([]);
	});
});

describe('getParticipatedPolls()', () => {
	it('reads the polls the viewer voted in', async () => {
		mockApiClient.mockResolvedValue({ content: [newPoll], total: 1, page: 1, limit: 50 });
		const polls = await getParticipatedPolls();
		expect(polls[0].myOptionId).toBe('opt-sun');
		expect(mockApiClient).toHaveBeenCalledWith('/votes/participated?page=1&size=50');
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
		const result = await castBallot('poll-1', 'opt-1');
		expect(result).toEqual({ ok: true, data: undefined });
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1/vote', {
			method: 'POST',
			body: JSON.stringify({ optionIds: ['opt-1'] }),
		});
		expect(revalidateTag).toHaveBeenCalledWith('poll:poll-1', { expire: 0 });
	});

	it('reports the API\'s current vote.not_allowed as ended', async () => {
		mockApiClient.mockRejectedValue(
			new ApiError('Voting closed', 400, { errorCode: 'vote.not_allowed' })
		);
		expect(isPollEnded(await castBallot('poll-1', 'opt-1'))).toBe(true);
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
	it('sends DELETE to /votes/{id}/vote/{optionId}', async () => {
		await retractBallot('poll-1', 'opt-2');
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1/vote/opt-2', { method: 'DELETE' });
		expect(revalidateTag).toHaveBeenCalledWith('poll:poll-1', { expire: 0 });
		expect(revalidateTag).toHaveBeenCalledWith('polls-feed', { expire: 0 });
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
	it('never sends multi-choice and maps visibility to anonymous', async () => {
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
			anonymous: true,
			voterVisibility: 'nobody',
		});
		expect(updateTag).toHaveBeenCalledWith('polls-feed');
	});

	it('updates a Scheduled Poll with PUT', async () => {
		await updatePoll('poll-1', { ...input, voterVisibility: 'owner' });
		const [url, init] = mockApiClient.mock.calls[0];
		expect(url).toBe('/votes/poll-1');
		expect(init!.method).toBe('PUT');
		expect(JSON.parse(init!.body as string).anonymous).toBe(false);
		expect(revalidateTag).toHaveBeenCalledWith('poll:poll-1', { expire: 0 });
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
