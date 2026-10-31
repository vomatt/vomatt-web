'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { StickyBar } from '@/components/StickyBar';
import { ChevronLeft } from '@/components/ui/SvgIcons';

/** The Navigation API; TypeScript's DOM types don't include it yet. */
type NavigationApi = { canGoBack: boolean };

/**
 * "‹ Back": back to the previous page as a quiet link, no button chrome. Its hit area is
 * 44px tall but takes only its line's height in the layout.
 *
 * Goes back in history when the previous entry is a page of this site, so the viewer lands
 * where they came from (notifications, a profile). A page opened directly (a shared link,
 * a new tab) has no such entry and follows `href` instead.
 */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
	const router = useRouter();

	function goBack(event: React.MouseEvent<HTMLAnchorElement>) {
		const navigation = (window as { navigation?: NavigationApi }).navigation;
		// Modified clicks open href in a new tab as usual
		if (!navigation?.canGoBack || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		router.back();
	}

	return (
		// Stays under the phone Header as the page scrolls; the bar's 44px backs the hit area
		<StickyBar data-sticky-bar className="-my-3">
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
