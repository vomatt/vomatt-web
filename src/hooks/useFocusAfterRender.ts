import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * A ref and a `focus()` that moves focus to it once the state set alongside has rendered:
 * a field gets focus after it's marked invalid (so the error is read), and focus lands before
 * a dialog reclaims it from a button that just unmounted.
 */
export function useFocusAfterRender<T extends HTMLElement>() {
	const ref = useRef<T>(null);
	const [request, setRequest] = useState(0);

	useLayoutEffect(() => {
		if (request) ref.current?.focus();
	}, [request]);

	const focus = useCallback(() => setRequest((n) => n + 1), []);
	return [ref, focus] as const;
}
