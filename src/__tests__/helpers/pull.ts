import { act } from '@testing-library/react';

import { PULL_THRESHOLD } from '@/components/Refreshable';

/** Fires a touch event with one finger at (x, y), or none for an end or cancel. */
export function touch(type: string, target: Element, x: number, y: number) {
	const event = new Event(type, { bubbles: true }) as Event & { touches: { clientX: number; clientY: number }[] };
	event.touches = type === 'touchend' || type === 'touchcancel' ? [] : [{ clientX: x, clientY: y }];
	act(() => {
		target.dispatchEvent(event);
	});
}

/** A drag from (0, 0) to (dx, dy), ending with `end`. */
export function drag(dx: number, dy: number, { target = document.body as Element, end = 'touchend' } = {}) {
	touch('touchstart', target, 0, 0);
	touch('touchmove', target, dx / 2, dy / 2);
	touch('touchmove', target, dx, dy);
	touch(end, target, dx, dy);
}

/** A finger travel that pulls past the refresh threshold. */
export const FAR_ENOUGH = (PULL_THRESHOLD + 10) * 2;
