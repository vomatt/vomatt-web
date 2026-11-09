import { useEffect, useEffectEvent } from 'react';

// How far the anchor may move before its popup no longer reads as attached to it
const DRIFT_PX = 24;

/**
 * Closes an open popup once a scroll carries its anchor away. Popups sit above the sticky bars (z-50) so they can
 * open from inside a dialog, so one scrolled along with the page would ride over those bars. Only the anchor moving
 * counts: scrolling something else, or the last of a fling, leaves the popup open. Pass no anchor while closed.
 */
export function useCloseOnScrollAway(anchor: Element | null | undefined, close: () => void) {
	const onClose = useEffectEvent(close);
	useEffect(() => {
		if (!anchor) return;
		const start = anchor.getBoundingClientRect();
		const onScroll = () => {
			const now = anchor.getBoundingClientRect();
			if (Math.abs(now.top - start.top) > DRIFT_PX || Math.abs(now.left - start.left) > DRIFT_PX) onClose();
		};
		// Captured, so a dialog's list or another scroller moving the anchor counts too
		window.addEventListener('scroll', onScroll, { capture: true, passive: true });
		return () => window.removeEventListener('scroll', onScroll, { capture: true });
	}, [anchor]);
}
