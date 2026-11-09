import { useEffect, useState } from 'react';

/** `keyboard`: an on-screen keyboard covers part of the page (pinch zoom alone doesn't count). */
export type VisualViewportBox = { top: number; height: number; keyboard: boolean };

// Keyboards are taller than this; the browser's toolbars collapsing is not
const KEYBOARD_MIN = 150;

/**
 * The part of the page the visitor can actually see, while `active`.
 * iOS Safari keeps `dvh` and fixed positioning on the full screen when the keyboard opens,
 * so anything pinned to the bottom of a fixed box ends up under the keyboard.
 */
export function useVisualViewport(active: boolean): VisualViewportBox | null {
	const [box, setBox] = useState<VisualViewportBox | null>(null);

	useEffect(() => {
		const viewport = window.visualViewport;
		if (!active || !viewport) return;
		// The keyboard is measured against the tallest the page has been at this width, in unzoomed
		// pixels: iOS scales innerHeight with pinch zoom, and some browsers shrink it for the keyboard
		let width = 0;
		let tallest = 0;
		const update = () => {
			const seen = viewport.height * viewport.scale;
			const seenWidth = Math.round(viewport.width * viewport.scale);
			if (seenWidth !== width) {
				width = seenWidth;
				tallest = 0;
			}
			tallest = Math.max(tallest, seen, window.innerHeight, document.documentElement.clientHeight);
			setBox({
				top: viewport.offsetTop,
				height: viewport.height,
				keyboard: tallest - seen > KEYBOARD_MIN,
			});
		};
		update();
		viewport.addEventListener('resize', update);
		viewport.addEventListener('scroll', update);
		return () => {
			viewport.removeEventListener('resize', update);
			viewport.removeEventListener('scroll', update);
			setBox(null);
		};
	}, [active]);

	return box;
}
