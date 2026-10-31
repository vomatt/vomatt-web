'use client';

import { useEffect, useRef, useState } from 'react';

/** What a lookup found, tagged with the term it answers so stale results never show. */
export type Lookup<T> = { term: string; items: T[]; failed: boolean };

/**
 * Runs `load(term)` once typing pauses for `delay` ms, and keeps the latest answer.
 * A null term looks nothing up. Compare `lookup.term` with the current term before showing it.
 */
export function useDebouncedLookup<T>(term: string | null, load: (term: string) => Promise<T[]>, delay: number) {
	const [lookup, setLookup] = useState<Lookup<T> | null>(null);
	// The latest loader, so a new closure each render doesn't restart the timer
	const loadRef = useRef(load);
	useEffect(() => {
		loadRef.current = load;
	});

	useEffect(() => {
		if (term === null) return;
		let ignore = false;
		const timer = setTimeout(async () => {
			try {
				const items = await loadRef.current(term);
				if (!ignore) setLookup({ term, items, failed: false });
			} catch (error) {
				console.error('Lookup failed', { term, error });
				if (!ignore) setLookup({ term, items: [], failed: true });
			}
		}, delay);
		return () => {
			ignore = true;
			clearTimeout(timer);
		};
	}, [term, delay]);

	return lookup;
}
