import { act, renderHook } from '@testing-library/react';

import { useCursorList } from '@/hooks/useCursorList';

const a = { id: 'a' };
const b = { id: 'b' };
const c = { id: 'c' };

describe('useCursorList', () => {
	it('appends the next page, dropping duplicates', async () => {
		const fetchPage = jest.fn().mockResolvedValue({ items: [b, c], nextCursor: null });
		const first = { items: [a, b], nextCursor: 'n1' };
		const { result } = renderHook(() => useCursorList(first, fetchPage));

		await act(() => result.current.loadMore());
		expect(fetchPage).toHaveBeenCalledWith('n1');
		expect(result.current.items).toEqual([a, b, c]);
		expect(result.current.hasMore).toBe(false);
	});

	it('keeps the cursor after a failed page so it can be retried', async () => {
		const fetchPage = jest.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue({ items: [b], nextCursor: null });
		const first = { items: [a], nextCursor: 'n1' };
		const { result } = renderHook(() => useCursorList(first, fetchPage));

		await act(() => result.current.loadMore());
		expect(result.current.loadFailed).toBe(true);
		expect(result.current.hasMore).toBe(true);

		await act(() => result.current.loadMore());
		expect(fetchPage).toHaveBeenLastCalledWith('n1');
		expect(result.current.items).toEqual([a, b]);
		expect(result.current.loadFailed).toBe(false);
	});

	it('starts over on reset', () => {
		const first = { items: [a], nextCursor: 'n1' };
		const fetchPage = jest.fn();
		const { result } = renderHook(() => useCursorList(first, fetchPage));
		act(() => result.current.reset({ items: [c], nextCursor: null }));
		expect(result.current.items).toEqual([c]);
		expect(result.current.hasMore).toBe(false);
	});

	it('follows a new first page from the server', () => {
		const { result, rerender } = renderHook(({ page }) => useCursorList(page, jest.fn()), {
			initialProps: { page: { items: [a], nextCursor: null as string | null } },
		});
		rerender({ page: { items: [b, c], nextCursor: 'n2' } });
		expect(result.current.items).toEqual([b, c]);
		expect(result.current.hasMore).toBe(true);
	});

	it('drops a page that arrives after a reset', async () => {
		let resolveOld: (page: { items: { id: string }[]; nextCursor: string | null }) => void = () => {};
		const fetchOld = jest.fn(() => new Promise<{ items: { id: string }[]; nextCursor: string | null }>((resolve) => (resolveOld = resolve)));
		const first = { items: [a], nextCursor: 'n1' };
		const { result } = renderHook(() => useCursorList(first, fetchOld));

		let pending: Promise<void> = Promise.resolve();
		act(() => {
			pending = result.current.loadMore();
		});
		act(() => result.current.reset({ items: [c], nextCursor: 'm1' }, jest.fn()));
		await act(async () => {
			resolveOld({ items: [b], nextCursor: 'n2' });
			await pending;
		});

		expect(result.current.items).toEqual([c]);
		expect(result.current.isLoading).toBe(false);
	});

	it('ignores a failure or spinner from a page that was in flight during a reset', async () => {
		let rejectOld: (error: Error) => void = () => {};
		const fetchOld = jest.fn(() => new Promise<{ items: { id: string }[]; nextCursor: string | null }>((_, reject) => (rejectOld = reject)));
		const first = { items: [a], nextCursor: 'n1' };
		const { result } = renderHook(() => useCursorList(first, fetchOld));

		let pending: Promise<void> = Promise.resolve();
		act(() => {
			pending = result.current.loadMore();
		});
		expect(result.current.isLoading).toBe(true);
		act(() => result.current.reset({ items: [c], nextCursor: 'm1' }, jest.fn()));
		expect(result.current.isLoading).toBe(false);
		await act(async () => {
			rejectOld(new Error('down'));
			await pending;
		});

		expect(result.current.loadFailed).toBe(false);
		expect(result.current.items).toEqual([c]);
	});

	it('drops a page that arrives after the server sends a new first page', async () => {
		let resolveOld: (page: { items: { id: string }[]; nextCursor: string | null }) => void = () => {};
		const fetchOld = jest.fn(() => new Promise<{ items: { id: string }[]; nextCursor: string | null }>((resolve) => (resolveOld = resolve)));
		const { result, rerender } = renderHook(({ page }) => useCursorList(page, fetchOld), {
			initialProps: { page: { items: [a], nextCursor: 'n1' as string | null } },
		});

		let pending: Promise<void> = Promise.resolve();
		act(() => {
			pending = result.current.loadMore();
		});
		rerender({ page: { items: [c], nextCursor: null } });
		expect(result.current.isLoading).toBe(false);
		await act(async () => {
			resolveOld({ items: [b], nextCursor: 'n2' });
			await pending;
		});

		expect(result.current.items).toEqual([c]);
		expect(result.current.hasMore).toBe(false);
	});

	it('keeps the new list loading when a page from before a reset arrives', async () => {
		let resolveOld: (page: { items: { id: string }[]; nextCursor: string | null }) => void = () => {};
		const fetchOld = jest.fn(() => new Promise<{ items: { id: string }[]; nextCursor: string | null }>((resolve) => (resolveOld = resolve)));
		const fetchNew = jest.fn(() => new Promise<{ items: { id: string }[]; nextCursor: string | null }>(() => {}));
		const first = { items: [a], nextCursor: 'n1' };
		const { result } = renderHook(() => useCursorList(first, fetchOld));

		let pending: Promise<void> = Promise.resolve();
		act(() => {
			pending = result.current.loadMore();
		});
		act(() => result.current.reset({ items: [c], nextCursor: 'm1' }, fetchNew));
		act(() => {
			void result.current.loadMore();
		});
		await act(async () => {
			resolveOld({ items: [b], nextCursor: 'n2' });
			await pending;
		});

		expect(fetchNew).toHaveBeenCalledWith('m1');
		expect(result.current.isLoading).toBe(true);
	});
});
