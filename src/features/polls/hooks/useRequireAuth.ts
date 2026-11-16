'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Wraps writes for signed-out visitors: the action opens the AuthDialog and
 * runs once sign-in succeeds. Reads never go through this.
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
	const isAuthed = isAuthenticated || isLocallyAuthed;

	const requireAuth = useCallback(
		(action: () => void) => {
			if (isAuthed) {
				action();
				return;
			}
			pendingAction.current = action;
			setOpen(true);
		},
		[isAuthed]
	);

	const onOpenChange = useCallback((value: boolean) => {
		setOpen(value);
		if (!value) pendingAction.current = null;
	}, []);

	const onAuthSuccess = useCallback(() => {
		const action = pendingAction.current;
		pendingAction.current = null;
		setIsLocallyAuthed(true);
		setOpen(false);
		action?.();
	}, []);

	return { isAuthed, requireAuth, authDialog: { open, onOpenChange, onAuthSuccess } };
}
