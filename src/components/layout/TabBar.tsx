'use client';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import {
	CircleUser,
	Home,
	Plus,
	Search,
	Star,
} from '@/components/ui/SvgIcons';
import { useUnreadCount } from '@/features/notifications/UnreadCountProvider';
import { cn } from '@/lib/utils';

const PollCreator = dynamic(
	() => import('@/features/polls/components/PollCreator').then((m) => ({ default: m.PollCreator })),
	{ ssr: false }
);
type TabBarProps = {
	className?: string;
	userSession?: any;
};

// The center tab is the primary action: an ink square, like the design's "Ask a question"
const createClassName =
	'flex h-11 w-13 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary-hover [&_svg]:size-5.5';

export function TabBar({ className, userSession }: TabBarProps) {
	const pathname = usePathname();
	const { count: unreadCount } = useUnreadCount();
	const linkList = [
		{
			title: 'Home',
			href: '/',
			icon: <Home />,
		},
		{
			title: 'Explore',
			href: '/explore',
			icon: <Search />,
		},
		{
			title: 'Create Vote',
			href: userSession ? null : '/login',
			icon: userSession ? (
				<PollCreator
					triggerChildren={
						<button type="button" aria-label="Create Vote" className={createClassName}>
							<Plus />
						</button>
					}
				/>
			) : (
				<Plus />
			),
			primary: true,
		},
		{
			title: 'My Polls',
			// Unread results are marked in My Polls' Ended tab
			href: '/my-polls',
			icon: (
				<span className="relative">
					<Star />
					{unreadCount > 0 && (
						<span
							aria-label={`${unreadCount}`}
							className="absolute -right-1 -top-1 size-2.5 rounded-full bg-volt ring-1 ring-foreground/40"
						/>
					)}
				</span>
			),
		},
		{
			title: 'Account',
			href: '/account',
			icon: <CircleUser />,
		},
	];

	const routeToHide = ['/login'];
	if (routeToHide.includes(pathname)) return null;

	return (
		<nav
			className={cn(
				'[--tabbar-height:64px] fixed bottom-0 w-full flex justify-between items-center h-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-card border-t border-border md:hidden',
				className
			)}
		>
			{linkList.map(({ href, title, icon, primary }, index) => {
				const isActive = !!href && (href === '/' ? pathname === '/' : pathname.startsWith(href));
				return href ? (
					<NextLink
						key={index}
						href={href}
						aria-label={title}
						aria-current={isActive ? 'page' : undefined}
						className="flex-1 h-full flex justify-center items-center"
						title={title}
					>
						{primary ? (
							<span className={createClassName}>{icon}</span>
						) : (
							<span
								className={cn(
									'flex size-12 items-center justify-center [&_svg]:size-6',
									isActive
										? 'text-foreground shadow-[inset_0_-2px_0_var(--foreground)]'
										: 'text-muted-foreground'
								)}
							>
								{icon}
							</span>
						)}
					</NextLink>
				) : (
					<div
						key={index}
						className="flex-1 h-full flex justify-center items-center"
						title={title}
					>
						{icon}
					</div>
				);
			})}
		</nav>
	);
}
