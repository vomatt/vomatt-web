'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wraps writes for signed-out visitors: the action opens the AuthDialog and
 * runs once sign-in succeeds, and `onCancel` runs if they close it instead.
 * Reads never go through this.
 */
export function useRequireAuth(isAuthenticated: boolean) {
	// Bridges the gap between signing in here and the page's session catching up; a sign-out ends it
	const [isLocallyAuthed, setIsLocallyAuthed] = useState(false);
	const [wasAuthenticated, setWasAuthenticated] = useState(isAuthenticated);
	if (wasAuthenticated !== isAuthenticated) {
		setWasAuthenticated(isAuthenticated);
		if (!isAuthenticated) setIsLocallyAuthed(false);
	}
	const [open, setOpen] = useState(false);
	const pendingAction = useRef<(() => void) | null>(null);
	const pendingCancel = useRef<(() => void) | null>(null);
	const isAuthed = isAuthenticated || isLocallyAuthed;

	const requireAuth = useCallback(
		(action: () => void, onCancel?: () => void) => {
			if (isAuthed) {
				action();
				return;
			}
			pendingAction.current = action;
			pendingCancel.current = onCancel ?? null;
			setOpen(true);
		},
		[isAuthed]
	);

	const onOpenChange = useCallback((value: boolean) => {
		setOpen(value);
		if (value) return;
		const cancel = pendingCancel.current;
		pendingAction.current = null;
		pendingCancel.current = null;
		cancel?.();
	}, []);

	// Leaving the page mid sign-in (a link, the TabBar) unmounts without a close, so it counts as cancelling. A
	// reload runs no clean-up and keeps what waits. Deferred, since a Strict Mode remount comes straight back
	const mounted = useRef(false);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
			setTimeout(() => {
				if (!mounted.current) pendingCancel.current?.();
			}, 0);
		};
	}, []);

	const onAuthSuccess = useCallback(() => {
		const action = pendingAction.current;
		pendingAction.current = null;
		pendingCancel.current = null;
		setIsLocallyAuthed(true);
		setOpen(false);
		action?.();
	}, []);

	return { isAuthed, requireAuth, authDialog: { open, onOpenChange, onAuthSuccess } };
}
