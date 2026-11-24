import { act, renderHook, waitFor } from '@testing-library/react';

import { useComments } from '@/features/polls/hooks/useComments';

const mockGetComments = jest.fn();
jest.mock('@/features/polls/service', () => ({
	getComments: (...args: unknown[]) => mockGetComments(...args),
}));

const comment = (id: string) => ({
	id,
	text: id,
	author: 'alice',
	authorAvatarUrl: null,
	userId: 'u1',
	createdAt: '2026-11-20T10:00:00Z',
	likeCount: 0,
	replies: [],
});
const page = (ids: string[], nextCursor: string | null) => ({ ok: true, data: { items: ids.map(comment), nextCursor } });

it('drops an older page that arrives after a refresh started the list over', async () => {
	mockGetComments.mockResolvedValueOnce(page(['c1', 'c2'], 'cursor-2'));
	const { result } = renderHook(() => useComments('poll-1', { enabled: true }));
	await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual(['c1', 'c2']));

	let resolveOlder!: (value: unknown) => void;
	mockGetComments.mockReturnValueOnce(new Promise((resolve) => (resolveOlder = resolve)));
	mockGetComments.mockResolvedValueOnce(page(['c0', 'c1'], 'cursor-fresh'));
	let loadingMore!: Promise<void>;
	act(() => {
		loadingMore = result.current.loadMore();
	});
	await act(() => result.current.refresh(5));
	await act(async () => {
		resolveOlder(page(['c3'], null));
		await loadingMore;
	});

	expect(result.current.comments.map((c) => c.id)).toEqual(['c0', 'c1']);
	expect(result.current.hasMore).toBe(true);
});
