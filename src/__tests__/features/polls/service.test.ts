import { ApiError, apiClient, AuthError, publicFetch } from '@/lib/api/client';

import { isPollEnded, isSealed } from '@/features/polls/errors';
import {
	castBallot,
	closePoll,
	createPoll,
	deleteComment,
	getFeed,
	getMyBallot,
	getPoll,
	getPollForViewer,
	getResults,
	likeComment,
	retractBallot,
	unlikeComment,
	updateComment,
	updatePoll,
} from '@/features/polls/service';

jest.mock('next/cache', () => ({ updateTag: jest.fn() }));
jest.mock('next/navigation', () => ({ unstable_rethrow: jest.fn() }));
jest.mock('@/data/auth', () => ({ getUserSession: jest.fn() }));

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

const { updateTag } = jest.requireMock('next/cache');
const { getUserSession } = jest.requireMock('@/data/auth');
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
	getUserSession.mockResolvedValue(null);
});

describe('getPoll()', () => {
	it('parses the current Poll shape', async () => {
		mockPublicFetch.mockResolvedValue(oldPoll);
		const poll = await getPoll('poll-1');
		expect(poll?.options[0].votes).toBe(2);
		expect(poll?.totalVotes).toBe(3);
		expect(poll).not.toHaveProperty('allowMultipleChoices');
	});

	it('parses the sealed Poll shape without counts', async () => {
		mockPublicFetch.mockResolvedValue(newPoll);
		const poll = await getPoll('poll-2');
		expect(poll?.options[0].votes).toBeUndefined();
		expect(poll?.participantCount).toBe(128);
		expect(poll?.myOptionId).toBe('opt-sun');
		expect(poll?.voterVisibility).toBe('owner');
	});

	it('tags the request with the poll tag', async () => {
		mockPublicFetch.mockResolvedValue(oldPoll);
		await getPoll('poll-1');
		expect(mockPublicFetch).toHaveBeenCalledWith('/votes/poll-1', {
			next: { revalidate: 30, tags: ['poll:poll-1'] },
		});
	});

	it('returns null on 404', async () => {
		mockPublicFetch.mockRejectedValue(new ApiError('Not found', 404));
		expect(await getPoll('missing')).toBeNull();
	});
});

describe('getPollForViewer()', () => {
	it('attaches a signed-in viewer\'s Ballot', async () => {
		getUserSession.mockResolvedValue({ sub: 'klaus' });
		mockPublicFetch.mockResolvedValue(oldPoll);
		mockApiClient.mockResolvedValue({ hasVoted: true, selectedOptions: ['opt-1'] });
		expect((await getPollForViewer('poll-1'))?.myOptionId).toBe('opt-1');
	});

	it('skips the Ballot lookup when signed out', async () => {
		mockPublicFetch.mockResolvedValue(oldPoll);
		expect((await getPollForViewer('poll-1'))?.myOptionId).toBeUndefined();
		expect(mockApiClient).not.toHaveBeenCalled();
	});

	it('skips the Ballot lookup when the Poll is missing', async () => {
		getUserSession.mockResolvedValue({ sub: 'klaus' });
		mockPublicFetch.mockRejectedValue(new ApiError('Not found', 404));
		expect(await getPollForViewer('missing')).toBeNull();
		expect(mockApiClient).not.toHaveBeenCalled();
	});
});

describe('getFeed()', () => {
	it('reads a Spring page and turns the next page number into a cursor', async () => {
		mockPublicFetch.mockResolvedValue({ content: [oldPoll], last: false, number: 0 });
		const page = await getFeed();
		expect(page.items).toHaveLength(1);
		expect(page.nextCursor).toBe('1');
		expect(mockPublicFetch).toHaveBeenCalledWith('/votes?page=0&size=10', {
			next: { tags: ['polls-feed'] },
		});
	});

	it('attaches a signed-in viewer\'s Ballots in parallel', async () => {
		getUserSession.mockResolvedValue({ sub: 'klaus' });
		mockPublicFetch.mockResolvedValue({ content: [oldPoll, newPoll], last: true, number: 0 });
		mockApiClient.mockResolvedValue({ hasVoted: true, selectedOptions: ['opt-2'] });
		const page = await getFeed();

		expect(page.items[0].myOptionId).toBe('opt-2');
		// newPoll already carries myOptionId, so it is not looked up
		expect(page.items[1].myOptionId).toBe('opt-sun');
		expect(mockApiClient).toHaveBeenCalledTimes(1);
	});

	it('skips Ballot lookups when signed out', async () => {
		mockPublicFetch.mockResolvedValue({ content: [oldPoll], last: true, number: 0 });
		const page = await getFeed();
		expect(page.items[0].myOptionId).toBeUndefined();
		expect(mockApiClient).not.toHaveBeenCalled();
	});

	it('caps the page size a client can ask for', async () => {
		mockPublicFetch.mockResolvedValue({ content: [], last: true, number: 0 });
		await getFeed(null, 1000);
		expect(mockPublicFetch).toHaveBeenCalledWith('/votes?page=0&size=50', expect.anything());
	});

	it('reads a cursor page', async () => {
		mockPublicFetch.mockResolvedValue({ items: [newPoll], nextCursor: null });
		const page = await getFeed('abc');
		expect(page).toEqual({ items: [expect.objectContaining({ id: 'poll-2' })], nextCursor: null });
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
		expect(updateTag).toHaveBeenCalledWith('poll:poll-1');
	});

	it('reports vote.ended without throwing', async () => {
		mockApiClient.mockRejectedValue(
			new ApiError('Poll ended', 409, { errorCode: 'vote.ended' })
		);
		const result = await castBallot('poll-1', 'opt-1');
		expect(result.ok).toBe(false);
		expect(isPollEnded(result)).toBe(true);
		expect(updateTag).not.toHaveBeenCalled();
	});
});

describe('retractBallot()', () => {
	it('sends DELETE to /votes/{id}/vote', async () => {
		await retractBallot('poll-1');
		expect(mockApiClient).toHaveBeenCalledWith('/votes/poll-1/vote', { method: 'DELETE' });
		expect(updateTag).toHaveBeenCalledWith('poll:poll-1');
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
		expect(updateTag).toHaveBeenCalledWith('poll:poll-1');
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
		expect(updateTag).toHaveBeenCalledWith('poll:poll-1');
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
