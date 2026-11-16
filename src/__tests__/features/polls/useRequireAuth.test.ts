import { act, renderHook } from '@testing-library/react';

import { useRequireAuth } from '@/features/polls/hooks/useRequireAuth';

describe('useRequireAuth', () => {
	it('asks a guest to sign in, then runs the action once they have', () => {
		const action = jest.fn();
		const { result } = renderHook(() => useRequireAuth(false));
		act(() => result.current.requireAuth(action));
		expect(result.current.authDialog.open).toBe(true);
		expect(action).not.toHaveBeenCalled();

		act(() => result.current.authDialog.onAuthSuccess());
		expect(action).toHaveBeenCalledTimes(1);
		expect(result.current.authDialog.open).toBe(false);
	});

	it('runs the action at once for a signed-in person', () => {
		const action = jest.fn();
		const { result } = renderHook(() => useRequireAuth(true));
		act(() => result.current.requireAuth(action));
		expect(action).toHaveBeenCalledTimes(1);
		expect(result.current.authDialog.open).toBe(false);
	});

	it('asks again after the person signs out, though they signed in through it', () => {
		const { result, rerender } = renderHook(({ authed }) => useRequireAuth(authed), { initialProps: { authed: false } });
		act(() => result.current.requireAuth(jest.fn()));
		act(() => result.current.authDialog.onAuthSuccess());
		rerender({ authed: true });
		rerender({ authed: false });

		const action = jest.fn();
		act(() => result.current.requireAuth(action));
		expect(result.current.isAuthed).toBe(false);
		expect(result.current.authDialog.open).toBe(true);
		expect(action).not.toHaveBeenCalled();
	});
});
