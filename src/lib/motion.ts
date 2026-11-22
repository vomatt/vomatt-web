/** The JS mirror of `--ease-out-strong` in global.css: motion's transitions can't read CSS variables. Keep the two in sync. */
export const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;

/**
 * Folds a list row away before it leaves the list, so what follows slides up instead of jumping.
 * `gap` is the list's gap in px, pulled back so the space between neighbours closes too.
 * Under reduced motion it only fades. Resolves when done; the caller then removes the row.
 */
export function foldAway(el: Element | null, gap = 0): Promise<void> {
	// jsdom has no Element.animate
	if (!(el instanceof HTMLElement) || typeof el.animate !== 'function') return Promise.resolve();
	const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
	const { height, minHeight, paddingTop, paddingBottom, borderTopWidth, borderBottomWidth } = getComputedStyle(el);
	// The gap to close sits above the row, or below it for the first row; an only row has none
	const first = !el.previousElementSibling;
	const margin = first ? 'marginBottom' : 'marginTop';
	const pull = first && !el.nextElementSibling ? 0 : gap;
	const from = reduce
		? { opacity: 1 }
		: { opacity: 1, height, minHeight, paddingTop, paddingBottom, borderTopWidth, borderBottomWidth, [margin]: '0px' };
	const to = reduce
		? { opacity: 0 }
		: { opacity: 0, height: '0px', minHeight: '0px', paddingTop: '0px', paddingBottom: '0px', borderTopWidth: '0px', borderBottomWidth: '0px', [margin]: `${-pull}px` };
	el.style.overflow = 'clip';
	const animation = el.animate([from, to], {
		duration: 150,
		easing: `cubic-bezier(${EASE_OUT_STRONG.join(', ')})`,
		fill: 'forwards',
	});
	return animation.finished.then(() => undefined, () => undefined);
}
