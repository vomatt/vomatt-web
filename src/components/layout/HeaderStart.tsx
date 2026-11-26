'use client';

import Link from 'next/link';
import { useEffect, useSyncExternalStore } from 'react';

import { buttonVariants } from '@/components/ui/Button';
import { ChevronLeft } from '@/components/ui/SvgIcons';
import { cn } from '@/lib/utils';

type Back = {
	href: string;
	onClick?: React.MouseEventHandler<HTMLAnchorElement>;
	label: React.ReactNode;
};

let current: Back | null = null;
const listeners = new Set<() => void>();

function setBack(back: Back | null) {
	current = back;
	listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/**
 * The phone Header's left slot: the page's way back as a 44px chevron, set by `HeaderBack`.
 * Empty when the page has none; the grid keeps the logo centered either way.
 */
export function HeaderStart() {
	const back = useSyncExternalStore(subscribe, () => current, () => null);

	return (
		<div className="-ml-3 flex">
			{back && (
				<Link
					href={back.href}
					onClick={back.onClick}
					className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'rounded-full active:bg-muted')}
				>
					<ChevronLeft aria-hidden className="size-5.5" />
					<span className="sr-only">{back.label}</span>
				</Link>
			)}
		</div>
	);
}

/** Puts the page's way back in the phone Header while the page is shown. Renders nothing itself. */
export function HeaderBack({ href, onClick, label }: Back) {
	useEffect(() => {
		const back = { href, onClick, label };
		setBack(back);
		return () => {
			if (current === back) setBack(null);
		};
	});
	return null;
}
