import { apiClient } from '@/lib/api/client';

import {
	deactivateVote,
	deleteComment,
	getMyVoteStatus,
	getVoteResults,
	likeComment,
	removeVote,
	unlikeComment,
	updateComment,
	vote,
} from '@/lib/api/services/polls';

jest.mock('@/lib/api/client', () => ({
	apiClient: jest.fn(),
}));

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

beforeEach(() => {
	mockApiClient.mockClear();
	mockApiClient.mockResolvedValue(undefined);
});

describe('vote()', () => {
	it('sends POST to /api/v1/votes/{pollId}/vote with optionIds body', async () => {
		await vote('poll-1', ['opt-1']);
		expect(mockApiClient).toHaveBeenCalledWith('/api/v1/votes/poll-1/vote', {
			method: 'POST',
			body: JSON.stringify({ optionIds: ['opt-1'] }),
		});
	});

	it('supports multiple optionIds', async () => {
		await vote('poll-2', ['opt-a', 'opt-b']);
		expect(mockApiClient).toHaveBeenCalledWith('/api/v1/votes/poll-2/vote', {
			method: 'POST',
			body: JSON.stringify({ optionIds: ['opt-a', 'opt-b'] }),
		});
	});
});

describe('deactivateVote()', () => {
	it('sends PUT to /api/v1/votes/{voteId}/deactivate', async () => {
		await deactivateVote('vote-1');
		expect(mockApiClient).toHaveBeenCalledWith(
			'/api/v1/votes/vote-1/deactivate',
			{ method: 'PUT' }
		);
	});
});

describe('getVoteResults()', () => {
	it('sends GET to /api/v1/votes/{voteId}/results', async () => {
		await getVoteResults('vote-1');
		expect(mockApiClient).toHaveBeenCalledWith('/api/v1/votes/vote-1/results');
	});
});

describe('getMyVoteStatus()', () => {
	it('sends GET to /api/v1/votes/{voteId}/my-vote-status', async () => {
		await getMyVoteStatus('vote-1');
		expect(mockApiClient).toHaveBeenCalledWith(
			'/api/v1/votes/vote-1/my-vote-status'
		);
	});
});

describe('removeVote()', () => {
	it('sends DELETE to /api/v1/votes/{voteId}/vote/{optionId}', async () => {
		await removeVote('vote-1', 'opt-1');
		expect(mockApiClient).toHaveBeenCalledWith(
			'/api/v1/votes/vote-1/vote/opt-1',
			{ method: 'DELETE' }
		);
	});
});

describe('updateComment()', () => {
	it('sends PUT to /api/v1/votes/{voteId}/comments/{commentId}', async () => {
		await updateComment('vote-1', 'comment-1', 'edited text');
		expect(mockApiClient).toHaveBeenCalledWith(
			'/api/v1/votes/vote-1/comments/comment-1',
			{
				method: 'PUT',
				body: JSON.stringify({ text: 'edited text' }),
			}
		);
	});
});

describe('deleteComment()', () => {
	it('sends DELETE to /api/v1/votes/{voteId}/comments/{commentId}', async () => {
		await deleteComment('vote-1', 'comment-1');
		expect(mockApiClient).toHaveBeenCalledWith(
			'/api/v1/votes/vote-1/comments/comment-1',
			{ method: 'DELETE' }
		);
	});
});

describe('likeComment()', () => {
	it('sends POST to /api/v1/votes/{voteId}/comments/{commentId}/like', async () => {
		await likeComment('vote-1', 'comment-1');
		expect(mockApiClient).toHaveBeenCalledWith(
			'/api/v1/votes/vote-1/comments/comment-1/like',
			{ method: 'POST' }
		);
	});
});

describe('unlikeComment()', () => {
	it('sends DELETE to /api/v1/votes/{voteId}/comments/{commentId}/like', async () => {
		await unlikeComment('vote-1', 'comment-1');
		expect(mockApiClient).toHaveBeenCalledWith(
			'/api/v1/votes/vote-1/comments/comment-1/like',
			{ method: 'DELETE' }
		);
	});
});
