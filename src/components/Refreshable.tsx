'use client';

import { useRouter } from 'next/navigation';
import { createContext, type ReactNode, use, useEffect, useEffectEvent, useRef, useState, useTransition } from 'react';

import { Spinner } from '@/components/ui/Spinner';
import { RotateCw } from '@/components/ui/SvgIcons';
import { cn } from '@/lib/utils';

/** How far the finger travels per pixel the indicator moves. */
const RESISTANCE = 0.5;
export const PULL_THRESHOLD = 64;
const MAX_PULL = 96;
const REFRESHING_HEIGHT = 48;

/** Open layers over the page; a drag inside one scrolls or picks in it, never refreshes the page. */
const OVERLAYS = '[role="dialog"],[role="alertdialog"],[role="menu"],[role="listbox"]';

/** How many refreshes have finished; lists re-seed from their first page when it changes. */
const RefreshGeneration = createContext(0);

/**
 * A page that refetches on request: pulling down from the top on a touch screen. Pages that stay in
 * the browser's cache between visits (`unstable_dynamicStaleTime`) need it to show new polls.
 * Lists re-seed from the refreshed first page when `useRefreshGeneration` changes.
 */
export function Refreshable({ children }: { children: ReactNode }) {
	const router = useRouter();
	const [isRefreshing, startRefresh] = useTransition();
	const [pull, setPull] = useState(0);
	const [generation, setGeneration] = useState(0);
	const [wasRefreshing, setWasRefreshing] = useState(false);
	if (isRefreshing !== wasRefreshing) {
		setWasRefreshing(isRefreshing);
		if (!isRefreshing) setGeneration((n) => n + 1);
	}

	usePullDown({
		onDrag: setPull,
		onPulled: () => {
			if (!isRefreshing) startRefresh(() => router.refresh());
		},
	});

	const height = isRefreshing ? REFRESHING_HEIGHT : pull;

	return (
		<RefreshGeneration value={generation}>
			<div
				aria-hidden={!isRefreshing}
				style={{ height }}
				className={cn(
					'flex items-center justify-center overflow-hidden text-muted-foreground',
					// Eases back when let go; follows the finger while pulled
					pull === 0 && 'transition-[height] duration-200 motion-reduce:transition-none'
				)}
			>
				{isRefreshing ? (
					<Spinner className="size-5" />
				) : (
					pull > 0 && (
						<RotateCw
							className={cn('size-5 transition-opacity', pull < PULL_THRESHOLD && 'opacity-50')}
							style={{ transform: `rotate(${(pull / PULL_THRESHOLD) * 270}deg)` }}
						/>
					)
				)}
			</div>
			{children}
		</RefreshGeneration>
	);
}

/** Changes each time the enclosing `Refreshable` page finishes a refresh; 0 outside one. */
export function useRefreshGeneration() {
	return use(RefreshGeneration);
}

/**
 * Tracks a one-finger downward drag made with the page at the top, outside a dialog or menu. Moving up or
 * scrolling the page ends it. The browser's own pull-to-refresh, which reloads the whole app, is
 * off while it is mounted.
 */
function usePullDown({ onDrag, onPulled }: { onDrag: (distance: number) => void; onPulled: () => void }) {
	const drag = useRef<{ x: number; y: number; distance: number; vertical?: boolean } | null>(null);
	const handleDrag = useEffectEvent(onDrag);
	const handlePulled = useEffectEvent(onPulled);

	useEffect(() => {
		const root = document.documentElement;
		const previousOverscroll = root.style.overscrollBehaviorY;
		root.style.overscrollBehaviorY = 'contain';

		const release = (pulled: boolean) => {
			if (!drag.current) return;
			const { distance } = drag.current;
			drag.current = null;
			handleDrag(0);
			if (pulled && distance >= PULL_THRESHOLD) handlePulled();
		};
		const end = () => release(true);
		const cancel = () => release(false);
		const onStart = (event: TouchEvent) => {
			const target = event.target instanceof Element ? event.target : null;
			if (event.touches.length !== 1 || window.scrollY > 0 || target?.closest(OVERLAYS)) {
				drag.current = null;
				return;
			}
			const { clientX, clientY } = event.touches[0];
			drag.current = { x: clientX, y: clientY, distance: 0 };
		};
		const onMove = (event: TouchEvent) => {
			const current = drag.current;
			if (!current) return;
			const dx = event.touches[0].clientX - current.x;
			const dy = event.touches[0].clientY - current.y;
			// A sideways swipe (a scrolling pill row) is not a pull
			if (current.vertical === undefined && (dx !== 0 || dy !== 0)) current.vertical = Math.abs(dy) > Math.abs(dx);
			// Nor is scrolling the page: moving up, or the page leaving the top, ends the drag
			if (!current.vertical || dy < 0 || window.scrollY > 0) {
				release(false);
				return;
			}
			current.distance = Math.min(dy * RESISTANCE, MAX_PULL);
			handleDrag(current.distance);
		};

		window.addEventListener('touchstart', onStart, { passive: true });
		window.addEventListener('touchmove', onMove, { passive: true });
		window.addEventListener('touchend', end);
		window.addEventListener('touchcancel', cancel);
		return () => {
			root.style.overscrollBehaviorY = previousOverscroll;
			window.removeEventListener('touchstart', onStart);
			window.removeEventListener('touchmove', onMove);
			window.removeEventListener('touchend', end);
			window.removeEventListener('touchcancel', cancel);
		};
	}, []);
}
