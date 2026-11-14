'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { StickyBar } from '@/components/StickyBar';
import { ChevronLeft } from '@/components/ui/SvgIcons';
import { cn } from '@/lib/utils';

/** The Navigation API; TypeScript's DOM types don't include it yet. */
type NavigationApi = {
	canGoBack: boolean;
	currentEntry: { index: number } | null;
	entries(): { url: string | null }[];
	addEventListener(type: 'navigatesuccess', listener: () => void, options: { once: boolean }): void;
};

function getNavigation() {
	return (window as { navigation?: NavigationApi }).navigation;
}

function isModifiedClick(event: React.MouseEvent) {
	return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/**
 * Click handler for a link up to `href`: when the previous history entry is `href`, goes back to it
 * instead of pushing a second copy, which would leave this page behind it for the next Back to land on.
 * Refreshes it, since going back restores the page as it was when the viewer left.
 */
export function useReturnTo(href: string) {
	const router = useRouter();
	return (event: React.MouseEvent<HTMLAnchorElement>) => {
		const navigation = getNavigation();
		if (!navigation || isModifiedClick(event)) return;
		const index = navigation.currentEntry?.index ?? 0;
		const previous = index > 0 ? navigation.entries()[index - 1]?.url : null;
		if (!previous) return;
		const from = new URL(previous);
		const target = new URL(href, window.location.href);
		if (from.origin !== target.origin || from.pathname !== target.pathname || from.search !== target.search) return;
		event.preventDefault();
		navigation.addEventListener('navigatesuccess', () => router.refresh(), { once: true });
		router.back();
	};
}

/**
 * "‹ Back": back to the previous page as a quiet link, no button chrome. Its hit area is
 * 44px tall but takes only its line's height in the layout.
 *
 * Goes back in history when the previous entry is a page of this site, so the viewer lands
 * where they came from (notifications, a profile). A page opened directly (a shared link,
 * a new tab) has no such entry and follows `href` instead. With `strict`, goes back only when the
 * previous entry is `href` itself and follows `href` otherwise.
 */
export function BackLink({
	href,
	strict,
	className,
	children,
}: {
	href: string;
	strict?: boolean;
	className?: string;
	children: React.ReactNode;
}) {
	const router = useRouter();
	const returnTo = useReturnTo(href);

	function goBack(event: React.MouseEvent<HTMLAnchorElement>) {
		if (strict) return returnTo(event);
		// Modified clicks open href in a new tab as usual
		if (!getNavigation()?.canGoBack || isModifiedClick(event)) return;
		event.preventDefault();
		router.back();
	}

	return (
		// Stays under the phone Header as the page scrolls; the bar's 44px backs the hit area
		<StickyBar data-sticky-bar className={cn('-my-3', className)}>
			<Link
				href={href}
				onClick={goBack}
				className="inline-flex min-h-11 items-center gap-1 rounded-sm text-body-4 leading-5 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
			>
				<ChevronLeft aria-hidden className="size-3.5 shrink-0" />
				{children}
			</Link>
		</StickyBar>
	);
}
