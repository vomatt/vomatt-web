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
});
