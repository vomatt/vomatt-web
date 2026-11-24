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
	await act(() => result.current.refresh());
	await act(async () => {
		resolveOlder(page(['c3'], null));
		await loadingMore;
	});

	// c2 was already listed, so the refresh keeps it after the new first page
	expect(result.current.comments.map((c) => c.id)).toEqual(['c0', 'c1', 'c2']);
	expect(result.current.hasMore).toBe(true);
});

const pending = () => {
	let resolve!: (value: unknown) => void;
	mockGetComments.mockReturnValueOnce(new Promise((r) => (resolve = r)));
	return (value: unknown) => resolve(value);
};
const failed = { ok: false, message: 'offline' };

beforeEach(() => mockGetComments.mockReset());

it('keeps a comment from a later page through a refresh, with the cursor after it', async () => {
	mockGetComments.mockResolvedValueOnce(page(['c1', 'c2'], 'cursor-2'));
	const { result } = renderHook(() => useComments('poll-1', { enabled: true }));
	await waitFor(() => expect(result.current.status).toBe('ready'));
	mockGetComments.mockResolvedValueOnce(page(['c3'], 'cursor-3'));
	await act(() => result.current.loadMore());

	mockGetComments.mockResolvedValueOnce(page(['c0', 'c1'], 'cursor-fresh'));
	await act(async () => {
		expect(await result.current.refresh()).toBe(true);
	});

	expect(result.current.comments.map((c) => c.id)).toEqual(['c0', 'c1', 'c2', 'c3']);
	mockGetComments.mockResolvedValueOnce(page(['c4'], null));
	await act(() => result.current.loadMore());
	expect(mockGetComments).toHaveBeenLastCalledWith('poll-1', 'cursor-3');
});

it('shows the retry line, not a spinner, when a refresh fails after it replaced a retry', async () => {
	mockGetComments.mockResolvedValueOnce(failed);
	const { result } = renderHook(() => useComments('poll-1', { enabled: true }));
	await waitFor(() => expect(result.current.status).toBe('error'));

	const resolveRetry = pending();
	let retry!: Promise<void>;
	act(() => {
		retry = result.current.reload();
	});
	mockGetComments.mockResolvedValueOnce(failed);
	await act(async () => {
		expect(await result.current.refresh()).toBe(false);
	});
	await act(async () => {
		resolveRetry(page(['c1'], null));
		await retry;
	});

	expect(result.current.status).toBe('error');
});

it('drops a first load that arrives after a refresh', async () => {
	const resolveFirst = pending();
	const { result } = renderHook(() => useComments('poll-1', { enabled: true }));
	mockGetComments.mockResolvedValueOnce(page(['c1'], null));
	await act(() => result.current.refresh());
	await act(async () => resolveFirst(failed));

	expect(result.current.status).toBe('ready');
	expect(result.current.comments.map((c) => c.id)).toEqual(['c1']);
});

it("follows the Poll's count when the page brings a new one", async () => {
	mockGetComments.mockResolvedValue(page(['c1'], null));
	const { result, rerender } = renderHook(({ count }) => useComments('poll-1', { enabled: true, initialTotal: count }), {
		initialProps: { count: 1 },
	});
	await waitFor(() => expect(result.current.status).toBe('ready'));
	rerender({ count: 3 });
	expect(result.current.total).toBe(3);
});
