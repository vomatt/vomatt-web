'use client';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import { buttonVariants } from '@/components/ui/Button';
import {
	CircleUser,
	Home,
	Plus,
	Search,
	Star,
} from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatUnreadCount, useUnreadCount } from '@/features/notifications/UnreadCountProvider';
import { UnreadDot } from '@/features/notifications/UnreadDot';
import { CreatePollTrigger } from '@/features/polls/components/CreatePollTrigger';
import { isActivePath, profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

type TabBarProps = {
	className?: string;
	userSession?: any;
	username?: string;
};

// The center tab is the primary action: the create button as a square, the "Create a poll" action
const createClassName = cn(buttonVariants({ variant: 'create' }), 'w-13 px-0');
const cellClassName =
	'flex-1 h-full flex justify-center items-center outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring';

export function TabBar({ className, userSession, username }: TabBarProps) {
	const pathname = usePathname();
	const { t } = useLanguage();
	const { count: unreadCount } = useUnreadCount();
	// /account redirects to the profile; link there directly so the tab shows as active
	const profileTabHref = username ? profileHref(username) : '/account';
	// The create action sits between these two halves
	const leftLinks = [
		{
			title: t('navigation.home'),
			href: '/',
			icon: <Home />,
		},
		{
			title: t('common.explore'),
			href: '/explore',
			icon: <Search />,
		},
	];
	const rightLinks = [
		{
			title: t('common.myPolls'),
			// Unread results are marked in My Polls' Ended tab
			href: '/my-polls',
			icon: (
				<span className="relative">
					<Star />
					{unreadCount > 0 && <UnreadDot label={`${formatUnreadCount(unreadCount)} ${t('notifications.unread')}`} className="absolute -right-1 -top-1" />}
				</span>
			),
		},
		{
			title: t('navigation.profile'),
			href: profileTabHref,
			icon: <CircleUser />,
		},
	];

	const routeToHide = ['/login'];
	if (routeToHide.includes(pathname)) return null;

	const renderLink = ({ href, title, icon }: (typeof leftLinks)[number]) => {
		const isPage = isActivePath(pathname, href);
		// Settings is reached from the profile, so the profile tab stays active there: the current section, not the page
		const isActive = isPage || (href === profileTabHref && pathname === '/settings');
		return (
			<NextLink
				key={href}
				href={href}
				aria-current={isPage ? 'page' : isActive ? 'true' : undefined}
				className={cellClassName}
			>
				<span
					className={cn(
						'flex size-12 items-center justify-center [&_svg]:size-6',
						isActive
							? // Forced colors drop the shadow bar; the border takes its place
								'text-foreground shadow-[inset_0_-2px_0_var(--foreground)] forced-colors:border-b-2'
							: 'text-muted-foreground'
					)}
				>
					{icon}
				</span>
				{/* Text, not aria-label, so an unread count inside the icon is read out too */}
				<span className="sr-only">{title}</span>
			</NextLink>
		);
	};

	return (
		<nav
			data-tabbar
			className={cn(
				'[--tabbar-height:64px] fixed bottom-0 w-full flex justify-between items-center h-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-card border-t border-border md:hidden',
				className
			)}
		>
			{leftLinks.map(renderLink)}
			{userSession ? (
				<div className={cellClassName}>
					<CreatePollTrigger>
						<button type="button" aria-label={t('common.createPoll')} className={createClassName}>
							<Plus className="size-5.5" />
						</button>
					</CreatePollTrigger>
				</div>
			) : (
				<NextLink href="/login" aria-label={t('common.createPoll')} className={cellClassName}>
					<span className={createClassName}>
						<Plus className="size-5.5" />
					</span>
				</NextLink>
			)}
			{rightLinks.map(renderLink)}
		</nav>
	);
}
