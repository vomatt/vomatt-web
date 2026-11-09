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
		const update = () =>
			setBox({
				top: viewport.offsetTop,
				height: viewport.height,
				keyboard: window.innerHeight - viewport.height * viewport.scale > KEYBOARD_MIN,
			});
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
