'use client';
import NextLink, { useLinkStatus } from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { AuthDialog } from '@/components/auth/AuthDialog';
import { buttonVariants } from '@/components/ui/Button';
import { Bell, CircleUser, Home, Plus, Search } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { formatUnreadCount, useUnreadCount } from '@/features/notifications/UnreadCountProvider';
import { UnreadDot } from '@/features/notifications/UnreadDot';
import { CreatePollTrigger } from '@/features/polls/components/CreatePollTrigger';
import { useRequireAuth } from '@/features/polls/hooks/useRequireAuth';
import { useKeyboardOpen } from '@/hooks/useVisualViewport';
import { accountHref, isActivePath, isChromeless } from '@/lib/routes';
import { cn } from '@/lib/utils';

type TabBarProps = {
	className?: string;
	userSession?: any;
	username?: string;
	avatarUrl?: string | null;
};

type Tab = {
	title: string;
	href: string;
	icon: React.ReactNode;
	/** `true` keeps the tab current on pages under it that aren't its own page */
	current: 'page' | 'true' | undefined;
};

// The center tab is the create action: a quiet square that sinks a little under the finger
const createClassName = cn(
	buttonVariants({ variant: 'ghost' }),
	'w-13 px-0 bg-muted text-foreground active:bg-foreground/10 motion-safe:transition-[background-color,scale] motion-safe:duration-150 motion-safe:active:scale-92'
);
const cellClassName =
	'group flex-1 h-full flex justify-center items-center outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring';

export function TabBar({ className, userSession, username, avatarUrl }: TabBarProps) {
	const pathname = usePathname();
	const { t } = useLanguage();
	const { count: unreadCount } = useUnreadCount();
	const keyboardOpen = useKeyboardOpen();
	const router = useRouter();
	const { requireAuth, authDialog } = useRequireAuth(!!userSession);

	if (isChromeless(pathname)) return null;

	const pageTab = (title: string, href: string, icon: React.ReactNode): Tab => ({
		title,
		href,
		icon,
		current: isActivePath(pathname, href) ? 'page' : undefined,
	});
	const home = pageTab(t('navigation.home'), '/', <Home className="size-6" />);
	const explore = pageTab(t('common.explore'), '/explore', <Search className="size-6" />);
	const notifications = pageTab(
		t('common.notifications'),
		'/notifications',
		<span className="relative">
			<Bell className="size-6" />
			{unreadCount > 0 && (
				<UnreadDot label={`${formatUnreadCount(unreadCount)} ${t('notifications.unread')}`} className="absolute -right-0.5 -top-0.5" />
			)}
		</span>
	);
	const profileHref = accountHref(username);
	const onProfile = isActivePath(pathname, profileHref);
	const profile: Tab = {
		title: t('navigation.profile'),
		href: profileHref,
		icon: username ? <UserAvatar username={username} avatarUrl={avatarUrl} className="size-6.5" /> : <CircleUser className="size-6" />,
		// Phones reach Settings from the profile, so the profile stays current there: the section, not the page
		current: onProfile ? 'page' : isActivePath(pathname, '/settings') ? 'true' : undefined,
	};

	const renderLink = ({ href, title, icon, current }: Tab) => (
		<NextLink key={href} href={href} aria-current={current} className={cellClassName}>
			<TabIcon icon={icon} isActive={!!current} />
			{/* Text, not aria-label, so the unread count inside the bell is read out too */}
			<span className="sr-only">{title}</span>
		</NextLink>
	);
	// Guests see the signed-in layout; these tabs ask them to sign in, then go on to the page
	const renderGuestTab = ({ href, title, icon }: Tab) => (
		<button key={href} type="button" onClick={() => requireAuth(() => router.push(href))} className={cellClassName}>
			<span className={tabIconClassName(false)}>{icon}</span>
			<span className="sr-only">{title}</span>
		</button>
	);
	const renderAccountTab = userSession ? renderLink : renderGuestTab;

	return (
		<nav
			data-tabbar
			data-nosnippet
			// iOS 26 Safari carries fixed bottom bars up above the keyboard; it stays behind the keyboard instead
			data-keyboard={keyboardOpen || undefined}
			className={cn(
				'data-keyboard:invisible [--tabbar-height:64px] fixed bottom-0 z-tabbar w-full flex justify-between items-center h-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-card/80 backdrop-blur-lg border-t border-border md:hidden',
				className
			)}
		>
			{renderLink(home)}
			{renderLink(explore)}
			<div className={cellClassName}>
				{/* One trigger for guests and the signed-in alike, so a guest's press survives sign-in and opens the creator */}
				<CreatePollTrigger requireAuth={userSession ? undefined : requireAuth}>
					<button type="button" aria-label={t('common.createPoll')} className={createClassName}>
						<Plus className="size-5.5" />
					</button>
				</CreatePollTrigger>
			</div>
			{renderAccountTab(notifications)}
			{renderAccountTab(profile)}
			{authDialog.open && <AuthDialog {...authDialog} />}
		</nav>
	);
}

/** A tab's icon, marked active from the tap on, so a route still rendering on the server doesn't look ignored. */
function TabIcon({ icon, isActive }: { icon: React.ReactNode; isActive: boolean }) {
	const { pending } = useLinkStatus();
	return (
		<span data-pending={pending || undefined} className={tabIconClassName(isActive || pending)}>
			{icon}
		</span>
	);
}

function tabIconClassName(isActive: boolean) {
	return cn(
		'relative flex size-12 items-center justify-center motion-safe:transition-[color,scale] motion-safe:duration-150 motion-safe:group-active:scale-88',
		// The current tab's dot: drawn as a border, not a fill, so forced colors keep it
		'after:absolute after:bottom-1 after:size-1 after:rounded-full after:border-2 after:border-current motion-safe:after:transition-[scale,opacity] motion-safe:after:duration-200',
		isActive
			? 'text-foreground after:scale-100 after:opacity-100'
			: 'text-muted-foreground group-active:text-foreground after:scale-0 after:opacity-0'
	);
}
