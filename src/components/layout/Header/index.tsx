'use client';
import NextLink, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BrandLink } from '@/components/BrandLink';
import { buttonVariants } from '@/components/ui/Button';
import { Bell, CircleUser } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { formatUnreadCount, useUnreadCount } from '@/features/notifications/UnreadCountProvider';
import { UnreadDot } from '@/features/notifications/UnreadDot';
import { useIsMobile } from '@/hooks/use-mobile';
import { accountHref, isActivePath, isChromeless } from '@/lib/routes';
import { cn } from '@/lib/utils';

// Within this many pixels of the top the header always shows
const NEAR_TOP = 56;
// Smaller moves are momentum jitter, not a change of direction
const MIN_DELTA = 10;

type HeaderProps = {
	signedIn: boolean;
	/** Where Log in goes; carries `session_expired` when the API refused the session. */
	loginLink: string;
	username?: string;
	avatarUrl?: string | null;
};

// The current page's icon sits on a muted circle, as the TabBar underlines its current tab
// A tapped link takes that look at once, before its page arrives
const iconLinkClassName = cn(
	buttonVariants({ variant: 'ghost', size: 'icon' }),
	'rounded-full [&[aria-current]]:bg-muted [&:has([data-pending])]:bg-muted'
);
// The bell sits in a frame the avatar's size, so the two read as a pair; the current mark fills the frame, not the 44px target
const bellLinkClassName = cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'group rounded-full');

/** The phone header: the logo, Notifications and the profile, sliding away while reading down and back on the way up. Desktop has the sidebar. */
export function Header({ signedIn, loginLink, username, avatarUrl }: HeaderProps) {
	const pathname = usePathname();
	const isMobile = useIsMobile();
	const { t } = useLanguage();
	const { count: unreadCount } = useUnreadCount();
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

	const profileLink = accountHref(username);
	const onProfile = isActivePath(pathname, profileLink);
	// Phones reach Settings from the profile, so the profile stays current there: the section, not the page
	const inProfileSection = onProfile || isActivePath(pathname, '/settings');

	return (
		<header
			data-mobile-header
			data-hidden={(isMobile && hidden) || undefined}
			className={cn(
				'fixed inset-x-0 top-0 z-header flex h-header items-center justify-between border-b border-border bg-background px-contain md:hidden',
				'motion-safe:transition-transform motion-safe:duration-400 motion-safe:ease-header',
				// A keyboard user tabbing into it brings it back
				'data-hidden:-translate-y-full data-hidden:focus-within:translate-y-0'
			)}
		>
			<BrandLink className="w-20" />
			{signedIn ? (
				// The icons' padding sits past the gutter, so the avatar's edge lines up with the page
				<div className="-mr-2.5 flex items-center gap-1">
					<NextLink
						href="/notifications"
						aria-current={isActivePath(pathname, '/notifications') ? 'page' : undefined}
						className={bellLinkClassName}
					>
						<span className="avatar-frame relative grid size-7 place-items-center group-[[aria-current]]:bg-muted group-has-[[data-pending]]:bg-muted">
							<Bell className="size-4.5" />
							{unreadCount > 0 && (
								<UnreadDot label={`${formatUnreadCount(unreadCount)} ${t('notifications.unread')}`} className="absolute -right-1 -top-1" />
							)}
						</span>
						{/* Text, not aria-label, so the unread count inside the icon is read out too */}
						<span className="sr-only">{t('common.notifications')}</span>
						<PendingMark />
					</NextLink>
					<NextLink
						href={profileLink}
						aria-current={onProfile ? 'page' : inProfileSection ? 'true' : undefined}
						className={iconLinkClassName}
					>
						{username ? <UserAvatar username={username} avatarUrl={avatarUrl} className="size-7" /> : <CircleUser className="size-6" />}
						<span className="sr-only">{t('navigation.profile')}</span>
						<PendingMark />
					</NextLink>
				</div>
			) : (
				<NextLink href={loginLink} className={buttonVariants({ size: 'sm' })}>
					{t('loginPrompt.ctaLabel')}
				</NextLink>
			)}
		</header>
	);
}

/** Marks its link while the page it opens is still on its way. */
function PendingMark() {
	const { pending } = useLinkStatus();
	return pending ? <span data-pending hidden /> : null;
}
