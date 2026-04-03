'use server';

import { ApiError, apiClient, publicFetch } from '@/lib/api/client';
import { Poll, PollCreatorData } from '@/types/poll';

export async function getPolls(page = 0, size = 10, tag?: string) {
	const params = new URLSearchParams({
		page: String(page),
		size: String(size),
	});
	if (tag) params.set('tag', tag);
	return publicFetch(`${process.env.API_URL}/api/v1/votes?${params}`);
}

export async function getPollsByCreator(username: string): Promise<Poll[]> {
	try {
		const url = `${process.env.API_URL}/api/v1/votes?creatorUsername=${encodeURIComponent(username)}`;
		const page = await publicFetch<{ content: Poll[] }>(url, {
			next: { revalidate: 60 },
		} as RequestInit);
		return page?.content ?? [];
	} catch {
		return [];
	}
}

export async function getPoll(id: string): Promise<Poll | null> {
	try {
		return await publicFetch<Poll>(
			`${process.env.API_URL}/api/v1/votes/${id}`,
			{ next: { revalidate: 30 } } as RequestInit
		);
	} catch (error) {
		if (error instanceof ApiError && error.statusCode === 404) return null;
		throw error;
	}
}

export async function getMyPolls() {
	return apiClient('/api/v1/votes/my');
}

export async function createPoll(data: PollCreatorData) {
	return apiClient('/api/v1/votes', {
		method: 'POST',
		body: JSON.stringify({
			title: data.title,
			description: data.description,
			options: data.options.map((opt, i) => ({
				text: opt.text,
				description: opt.description,
				displayOrder: i,
			})),
			startTime: data.startTime,
			endTime: data.endTime,
			allowMultipleChoices: data.allowMultipleChoices,
			anonymous: data.anonymous,
			tagIds: data.tagIds,
		}),
	});
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

export async function getComments(pollId: string, page = 0, size = 20) {
	const params = new URLSearchParams({
		page: String(page),
		size: String(size),
	});
	return apiClient(`/api/v1/votes/${pollId}/comments?${params}`);
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
