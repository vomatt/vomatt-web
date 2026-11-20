import { act, renderHook } from '@testing-library/react';

import { useUserSearch } from '@/features/polls/hooks/useUserSearch';

const mockSearchUsers = jest.fn();
jest.mock('@/lib/api/services/users', () => ({ searchUsers: (...a: unknown[]) => mockSearchUsers(...a) }));

const ali = { id: 'u1', username: 'ali', displayName: null, avatarUrl: null };

beforeEach(() => {
	jest.useFakeTimers();
	mockSearchUsers.mockReset();
});
afterEach(() => jest.useRealTimers());

it('looks an earlier term up again after a later search failed', async () => {
	mockSearchUsers.mockResolvedValueOnce({ items: [ali], nextCursor: null }).mockRejectedValueOnce(new Error('429'));
	const { result, rerender } = renderHook(({ term }) => useUserSearch(term, []), { initialProps: { term: 'ali' } });
	await act(async () => jest.advanceTimersByTime(300));
	expect(result.current.users).toEqual([ali]);

	rerender({ term: 'alix' });
	await act(async () => jest.advanceTimersByTime(300));
	expect(result.current.failed).toBe(true);

	mockSearchUsers.mockResolvedValueOnce({ items: [ali], nextCursor: null });
	rerender({ term: 'ali' });
	await act(async () => jest.advanceTimersByTime(300));
	expect(mockSearchUsers).toHaveBeenCalledTimes(3);
	expect(result.current.users).toEqual([ali]);
});
