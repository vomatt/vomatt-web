'use server';

import { ApiError, apiClient, publicFetch } from '@/lib/api/client';
import { PollCreatorData } from '@/types/poll';

export async function getPolls(page = 0) {
	return publicFetch(`${process.env.API_URL}/api/v1/votes?page=${page}`);
}

export async function getPoll(id: string) {
	try {
		return await publicFetch(`${process.env.API_URL}/api/v1/votes/${id}`);
	} catch (error) {
		if (error instanceof ApiError && error.statusCode === 404) return null;
		throw error;
	}
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
	const params = new URLSearchParams({ page, sort, status });
	if (q) params.set('q', q);
	return publicFetch(`${process.env.API_URL}/api/v1/votes?${params}`);
}

export async function getMyPolls() {
	return apiClient('/api/v1/votes/my');
}

export async function createPoll(data: PollCreatorData) {
	const response = await apiClient('/api/v1/votes', {
		method: 'POST',
		body: JSON.stringify({
			title: data.title,
			description: data.description,
			options: data.options,
			startTime: data.startTime,
			endTime: data.endTime,
			allowMultipleChoices: data.allowMultipleChoices,
			anonymous: data.anonymous,
			privacyMode: data.privacyMode,
			invitedUsers: data.privacyMode === 'invite-only' ? data.invitedUsers : undefined,
		}),
	});

	const { success, errorCode, data: pollData } = response || {};
	if (!success) return { status: 'ERROR' as const, message: errorCode };
	return { status: 'SUCCESS' as const, data: pollData };
}

export async function vote(pollId: string, optionIds: string[]) {
	return apiClient(`/api/v1/votes/${pollId}/vote`, {
		method: 'POST',
		body: JSON.stringify({ optionIds }),
	});
}

export async function deactivateVote(voteId: string) {
	return apiClient(`/api/v1/votes/${voteId}/deactivate`, { method: 'PUT' });
}

export async function getVoteResults(voteId: string) {
	return apiClient(`/api/v1/votes/${voteId}/results`);
}

export async function getMyVoteStatus(voteId: string) {
	return apiClient(`/api/v1/votes/${voteId}/my-vote-status`);
}

export async function removeVote(voteId: string, optionId: string) {
	return apiClient(`/api/v1/votes/${voteId}/vote/${optionId}`, {
		method: 'DELETE',
	});
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

export async function updateComment(
	voteId: string,
	commentId: string,
	text: string
) {
	return apiClient(`/api/v1/votes/${voteId}/comments/${commentId}`, {
		method: 'PUT',
		body: JSON.stringify({ text }),
	});
}

export async function deleteComment(voteId: string, commentId: string) {
	return apiClient(`/api/v1/votes/${voteId}/comments/${commentId}`, {
		method: 'DELETE',
	});
}

export async function likeComment(voteId: string, commentId: string) {
	return apiClient(`/api/v1/votes/${voteId}/comments/${commentId}/like`, {
		method: 'POST',
	});
}

export async function unlikeComment(voteId: string, commentId: string) {
	return apiClient(`/api/v1/votes/${voteId}/comments/${commentId}/like`, {
		method: 'DELETE',
	});
}
