'use server';

import { ApiError, apiClient } from '@/lib/api/client';
import { mockPolls, mockPollsPage } from '@/lib/api/mock/polls';
import { PollCreatorData } from '@/types/poll';

export async function getPolls(page = 0) {
	try {
		const res = await fetch(`${process.env.API_URL}/api/v1/votes?page=${page}`);
		const { success, data } = await res.json();
		if (success) return data;
	} catch {}
	return mockPollsPage;
}

export async function getPoll(id: string) {
	try {
		const res = await fetch(`${process.env.API_URL}/api/v1/votes/${id}`);
		const { success, data } = await res.json();
		if (success) return data;
	} catch {}
	return mockPolls.find((p) => p.id === id) ?? null;
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
	try {
		const params = new URLSearchParams({ page, sort, status });
		if (q) params.set('q', q);
		const res = await fetch(`${process.env.API_URL}/api/v1/votes?${params}`);
		const { success, data } = await res.json();
		if (success) return data;
	} catch {}
	const lower = q.toLowerCase();
	const filtered = lower
		? mockPolls.filter(
				(p) =>
					p.title.toLowerCase().includes(lower) ||
					p.description?.toLowerCase().includes(lower)
			)
		: mockPolls;
	return { ...mockPollsPage, content: filtered, totalElements: filtered.length };
}

export async function getMyPolls() {
	try {
		return await apiClient('/api/v1/votes/my');
	} catch (error) {
		if (error instanceof ApiError && error.statusCode !== 404) throw error;
		return mockPollsPage;
	}
}

export async function createPoll(data: PollCreatorData) {
	const response = await apiClient('/api/v1/votes', {
		method: 'POST',
		body: JSON.stringify({
			title: data.question,
			description: data.description,
			options: data.options,
			startTime: data.startTime,
			endTime: data.endTime,
			allowMultipleChoices: data.isAllowMultipleChoices,
			anonymous: data.isAnonymous,
		}),
	});
	const { success, errorCode, data: pollData } = response || {};
	if (!success) return { status: 'ERROR' as const, message: errorCode };
	return { status: 'SUCCESS' as const, data: pollData };
}

export async function vote(pollId: string, optionId: string) {
	return apiClient(`/api/v1/votes/${pollId}/options/${optionId}`, { method: 'POST' });
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
