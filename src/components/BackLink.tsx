import Link from 'next/link';

import { ChevronLeft } from '@/components/ui/SvgIcons';

/**
 * "‹ Home": back to the parent page as a quiet link, no button chrome. Its hit area is
 * 44px tall but takes only its line's height in the layout.
 */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<Link
			href={href}
			className="-my-3 inline-flex min-h-11 items-center gap-1 self-start rounded-sm text-[14px] leading-5 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
		>
			<ChevronLeft aria-hidden className="size-3.5 shrink-0" />
			{children}
		</Link>
	);
}
