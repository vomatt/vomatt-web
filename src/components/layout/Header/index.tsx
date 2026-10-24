'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BrandLink } from '@/components/BrandLink';
import { useIsMobile } from '@/hooks/use-mobile';
import { isChromeless } from '@/lib/routes';
import { cn } from '@/lib/utils';

// Within this many pixels of the top the header always shows
const NEAR_TOP = 56;
// Smaller moves are momentum jitter, not a change of direction
const MIN_DELTA = 10;

/** The phone header: the logo, sliding away while reading down and back on the way up. Desktop has the sidebar. */
export function Header() {
	const pathname = usePathname();
	const isMobile = useIsMobile();
	const [hidden, setHidden] = useState(false);

	useEffect(() => {
		if (!isMobile) return;
		let lastY = window.scrollY;
		function onScroll() {
			const y = window.scrollY;
			// At or past the end is iOS's bottom bounce, which scrolls back up on its own. Not at the top: a new
			// page that fits the screen is at its end there, and the scroll to it must bring the header back
			if (y > NEAR_TOP && y + window.innerHeight >= document.documentElement.scrollHeight) return;
			if (y > NEAR_TOP && Math.abs(y - lastY) < MIN_DELTA) return;
			setHidden(y > NEAR_TOP && y > lastY);
			lastY = y;
		}
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, [isMobile]);

	if (isChromeless(pathname)) return null;

	return (
		<header
			data-mobile-header
			data-hidden={(isMobile && hidden) || undefined}
			className={cn(
				'fixed inset-x-0 top-0 z-header flex h-header items-center border-b border-border bg-background px-contain md:hidden',
				'motion-safe:transition-transform motion-safe:duration-400 motion-safe:ease-header',
				// A keyboard user tabbing into it brings it back
				'data-hidden:-translate-y-full data-hidden:focus-within:translate-y-0'
			)}
		>
			<BrandLink className="w-20" />
		</header>
	);
}
