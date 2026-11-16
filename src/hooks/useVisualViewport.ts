import { type CSSProperties, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/** The part of the page left visible beside an on-screen keyboard. */
type VisualViewportBox = { top: number; height: number };

// Keyboards are taller than this; the browser's toolbars collapsing is not
const KEYBOARD_MIN = 150;

const NON_TEXT_INPUTS = new Set(['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit']);

/** Only a focused text field brings up a keyboard. */
const isTextEntry = (el: Element | null): el is HTMLElement =>
	el instanceof HTMLTextAreaElement ||
	(el instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(el.type)) ||
	(el instanceof HTMLElement && el.isContentEditable);

/** One shared watch for every caller, started by the first and stopped by the last. */
let box: VisualViewportBox | null = null;
const listeners = new Set<() => void>();
let stop: (() => void) | undefined;

/** Open keyboard-inset popups, and where the page sat under their scroll lock when the first one opened. */
let popups = 0;
let restY = 0;

/**
 * iOS reveals a focused field (a tap low in the form, or the form bar's next/previous arrows) by scrolling the page
 * under the scroll lock. A popup follows what's visible, so the field never comes into view and iOS keeps going,
 * until the popup's bottom passes the layout viewport's, where nothing fixed paints: the page shows above the
 * keyboard. While the keyboard is up, scroll it back; `useKeyboardInset` reveals the field in the popup instead.
 */
function restorePage() {
	if (box && popups && window.scrollY !== restY) window.scrollTo(window.scrollX, restY);
}

/**
 * Keeps `box` at what an on-screen keyboard leaves visible while it is up, else null.
 * iOS Safari keeps `dvh` and fixed positioning on the full screen when the keyboard opens,
 * so anything pinned to the bottom of a fixed box ends up under the keyboard.
 *
 * The keyboard counts only while a text field is focused: iOS may send no resize after it
 * closes, or one from mid-animation, so a size alone can stay stuck at "keyboard up".
 */
function watch(viewport: VisualViewport) {
	// The keyboard is measured against the tallest the page has been at this width, in unzoomed
	// pixels: iOS scales innerHeight with pinch zoom, and some browsers shrink it for the keyboard
	let width = 0;
	let tallest = 0;
	let watchingRemovals = false;
	// A mouse means no on-screen keyboard: a window made shorter (DevTools docked below) isn't one
	const finePointer = window.matchMedia?.('(pointer: fine)');
	const update = () => {
		const seen = viewport.height * viewport.scale;
		const seenWidth = Math.round(viewport.width * viewport.scale);
		if (seenWidth !== width) {
			width = seenWidth;
			tallest = 0;
		}
		tallest = Math.max(tallest, seen, window.innerHeight, document.documentElement.clientHeight);
		const keyboard = !finePointer?.matches && tallest - seen > KEYBOARD_MIN && isTextEntry(document.activeElement);
		// Removing the focused field (a picker swapping its field for the pick) sends no focusout;
		// watched only while the keyboard is up
		if (keyboard !== watchingRemovals) {
			watchingRemovals = keyboard;
			if (keyboard) removals.observe(document.body, { childList: true, subtree: true });
			else removals.disconnect();
		}
		const next = keyboard ? { top: viewport.offsetTop, height: viewport.height } : null;
		if (next?.top === box?.top && next?.height === box?.height) return;
		box = next;
		// iOS may have scrolled the page before the keyboard counted as up
		restorePage();
		listeners.forEach((listener) => listener());
	};
	// Other DOM changes while typing (lists re-rendering) can't close the keyboard, so they skip the measuring
	const removals = new MutationObserver(() => {
		if (!isTextEntry(document.activeElement)) update();
	});
	// focusout runs before focus lands anywhere, so it measures once that settles
	let settle: ReturnType<typeof setTimeout> | undefined;
	const updateSoon = () => {
		clearTimeout(settle);
		settle = setTimeout(update);
	};
	update();
	viewport.addEventListener('resize', update);
	viewport.addEventListener('scroll', update);
	document.addEventListener('focusin', update);
	document.addEventListener('focusout', updateSoon);
	window.addEventListener('scroll', restorePage);
	return () => {
		window.removeEventListener('scroll', restorePage);
		removals.disconnect();
		clearTimeout(settle);
		viewport.removeEventListener('resize', update);
		viewport.removeEventListener('scroll', update);
		document.removeEventListener('focusin', update);
		document.removeEventListener('focusout', updateSoon);
		box = null;
	};
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	if (listeners.size === 1 && window.visualViewport) stop = watch(window.visualViewport);
	return () => {
		listeners.delete(listener);
		if (listeners.size) return;
		stop?.();
		stop = undefined;
	};
}

const useVisualViewport = () => useSyncExternalStore(subscribe, () => box, () => null);

/** Whether an on-screen keyboard is up; re-renders only when that flips, not as the viewport scrolls. */
export const useKeyboardOpen = () => useSyncExternalStore(subscribe, () => box !== null, () => false);

// Room kept between the field and its scroll box's edge
const REVEAL_MARGIN = 16;

/**
 * Where a fixed box's `top: 0` lands in getBoundingClientRect's coordinates, read off a dialog backdrop
 * (`fixed inset-0`; a nested dialog has none, its parent's serves). Usually 0, but iOS 26 Safari measures
 * rects from the visible top while the keyboard is up, so there it is -offsetTop.
 */
const fixedOrigin = () =>
	document.querySelector('[data-slot="dialog-overlay"], [data-slot="alert-dialog-overlay"]')?.getBoundingClientRect().top ?? 0;

/**
 * Scrolls each scroll box around the focused text field just enough to show it, innermost first.
 * Only `overflow: auto/scroll` boxes inside the field's dialog popup move, the popup included: never the page.
 */
function revealFocusedField() {
	const field = document.activeElement;
	if (!isTextEntry(field) || !box) return;
	const popup = field.closest('[data-slot="dialog-content"], [data-slot="alert-dialog-content"]');
	if (!popup) return;
	const visibleTop = fixedOrigin() + box.top;
	for (let scroller = field.parentElement; scroller && popup.contains(scroller); scroller = scroller.parentElement) {
		if (!/auto|scroll/.test(getComputedStyle(scroller).overflowY) || scroller.scrollHeight <= scroller.clientHeight) continue;
		const outer = scroller.getBoundingClientRect();
		// Only what's above the keyboard counts: a popup taller than that (PollCreator, on phones and from sm) runs under it
		const top = Math.max(outer.top, visibleTop);
		const bottom = Math.min(outer.bottom, visibleTop + box.height);
		const rect = field.getBoundingClientRect();
		const above = top + REVEAL_MARGIN - rect.top;
		const below = rect.bottom + REVEAL_MARGIN - bottom;
		// A field taller than the box shows its top
		if (above > 0) scroller.scrollTop -= above;
		else if (below > 0) scroller.scrollTop += Math.min(below, -above);
	}
}

/**
 * While the keyboard is up (`useKeyboardInset`) a popup centers in what it leaves visible. The `[data-keyboard]`
 * selectors outrank the base `top`/`max-h`/translate and a dialog's own `sm:`/`md:` ones (AuthDialog's
 * `md:top-[120px]`), so a dialog that wants other keyboard layout says so with `data-keyboard:` (PollCreator). A
 * breakpoint-scoped one (`max-sm:data-keyboard:`) has the same specificity and wins because Tailwind emits breakpoint
 * variants later. Popups using them must not transition (`transition-none`): the focused field is revealed a frame after the popup resizes.
 */
export const keyboardInsetClasses =
	'data-keyboard:top-(--visible-center) data-keyboard:max-h-[calc(var(--visible-height)-2rem)] data-keyboard:-translate-y-1/2';

/**
 * Props that keep a dialog popup inside what the keyboard leaves visible, and nothing once it closes,
 * so the popup's own layout returns untouched. The popup's classes read `data-keyboard` and the
 * `--visible-top` / `--visible-center` / `--visible-height` variables. `style` is the popup's own, kept on top.
 * The popup must lock the page's scroll (a modal dialog): while the keyboard is up, any page scroll is undone.
 */
export function useKeyboardInset<State>(style: CSSProperties | ((state: State) => CSSProperties | undefined) | undefined) {
	const box = useVisualViewport();
	const height = box?.height;
	const shown = useRef<number | undefined>(undefined);

	// What's visible just shrank (or a field took focus while the keyboard is up): bring the field back
	// into its scroll boxes. Only when it shrinks: not on viewport scrolls, nor when it grows back (the
	// suggestion bar hiding), so a visitor scrolling the dialog by hand isn't pulled back.
	useEffect(() => {
		const shrank = height !== undefined && (shown.current === undefined || height < shown.current);
		shown.current = height;
		if (height === undefined) return;
		let frame = 0;
		// After the popup's keyboard layout has laid out
		const reveal = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(revealFocusedField);
		};
		if (shrank) reveal();
		document.addEventListener('focusin', reveal);
		return () => {
			cancelAnimationFrame(frame);
			document.removeEventListener('focusin', reveal);
		};
	}, [height]);

	// Read while rendering, before the popup's initial focus can have iOS scroll the page to the field
	const [openY] = useState(() => (typeof window === 'undefined' ? 0 : window.scrollY));
	// Popups using this are modal, so only iOS revealing a field scrolls the page under them (restorePage)
	useEffect(() => {
		if (popups++ === 0) restY = openY;
		return () => {
			popups--;
		};
	}, [openY]);

	if (!box) return { style };
	const inset = {
		'--visible-top': `${box.top}px`,
		'--visible-center': `${box.top + box.height / 2}px`,
		'--visible-height': `${box.height}px`,
	} as CSSProperties;
	return {
		'data-keyboard': '',
		style: typeof style === 'function' ? (state: State) => ({ ...inset, ...style(state) }) : { ...inset, ...style },
	};
}
