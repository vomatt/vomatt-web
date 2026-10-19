'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import BrandLogo from '@/components/BrandLogo';
import { Button, buttonVariants } from '@/components/ui/Button';
import { InitialAvatar } from '@/components/ui/InitialAvatar';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/Sidebar';
import {
	ArrowRight,
	Bell,
	Home,
	LogOut,
	PlusCircle,
	Search,
	TrendingUp,
	User,
} from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { formatUnreadCount, useUnreadCount } from '@/features/notifications/UnreadCountProvider';
import { CreatePollTrigger } from '@/features/polls/components/CreatePollTrigger';
import { signout } from '@/lib/api/services/auth';
import { isActivePath, profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { MyProfile } from '@/types/user';

const navigationItems = [
	{
		title: 'common.home',
		url: '/',
		icon: Home,
	},
	{
		title: 'common.myPolls',
		url: '/my-polls',
		icon: TrendingUp,
	},
	{
		title: 'common.explore',
		url: '/explore',
		icon: Search,
	},
	{
		title: 'common.notifications',
		url: '/notifications',
		icon: Bell,
		requiresAuth: true,
		showsUnreadCount: true,
	},
];

interface AppSidebarProps {
	userSession: any;
	profile: MyProfile | null;
}

const hideSideBarFromPages = ['/login'];

export function AppSidebar({ userSession, profile }: AppSidebarProps) {
	const { t } = useLanguage();
	const pathname = usePathname();
	const { count: unreadCount } = useUnreadCount();

	function handleLogout() {
		signout();
	}

	if (hideSideBarFromPages.includes(pathname)) return null;

	// /account redirects to the profile; link there directly so the card shows as active
	const accountHref = profile ? profileHref(profile.username) : '/account';

	return (
		<Sidebar className="border-sidebar-border">
			{/* Header */}
			<SidebarHeader className="px-5 pt-5 pb-5">
				<Link
					href="/"
					className="block w-24 text-sidebar-foreground hover:text-sidebar-foreground/70 transition-colors"
				>
					<BrandLogo />
				</Link>
			</SidebarHeader>

			{/* Primary action */}
			<div className="px-4 pb-4">
				{userSession ? (
					<CreatePollTrigger>
						<Button variant="create" className="w-full">
							<PlusCircle />
							{t('common.createPoll')}
						</Button>
					</CreatePollTrigger>
				) : (
					<Link href="/login" className={cn(buttonVariants({ variant: 'create' }), 'w-full')}>
						<PlusCircle />
						{t('common.createPoll')}
					</Link>
				)}
			</div>

			{/* Nav */}
			<SidebarContent className="px-2">
				<SidebarGroup className="p-0">
					<SidebarGroupContent>
						<SidebarMenu className="gap-0.5">
							{navigationItems.map((item) => {
								if (item.requiresAuth && !userSession) return null;
								const badge = item.showsUnreadCount ? unreadCount : 0;
								const isActive = isActivePath(pathname, item.url);

								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											render={
												<Link
													href={item.url}
													aria-current={isActive ? 'page' : undefined}
													className="flex items-center gap-3 w-full"
												/>
											}
											className={cn(
												'group h-11 rounded-lg border border-transparent px-3 cursor-pointer transition-colors duration-150',
												'text-muted-foreground hover:text-sidebar-foreground',
												isActive &&
													'border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent'
											)}
										>
											<item.icon className="size-5 shrink-0" />
											<span className="text-sm font-medium capitalize">{t(item.title)}</span>
											{badge > 0 && (
												<span className="ml-auto min-w-5 rounded-full bg-primary px-1.5 text-center font-mono text-[11px] leading-5 text-primary-foreground tabular-nums">
													{formatUnreadCount(badge)}
												</span>
											)}
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			{/* Footer */}
			<SidebarFooter className="px-3 py-10">
				{userSession ? (
					<div className="rounded-xl border border-sidebar-border bg-card overflow-hidden">
						<Link
							href={accountHref}
							className={cn(
								'group flex items-center gap-3 p-3 transition-colors',
								'hover:bg-surface-soft',
								pathname === accountHref && 'bg-surface-soft'
							)}
						>
							{profile ? (
								<UserAvatar username={profile.username} avatarUrl={profile.avatarUrl} className="size-9" />
							) : (
								// The profile failed to load; there's no name to draw from
								<InitialAvatar name="U" className="size-9 bg-sidebar-primary text-sidebar-primary-foreground" />
							)}

							<div className="flex-1 min-w-0">
								<p className="text-[13px] font-medium text-sidebar-foreground leading-tight truncate">
									{profile?.displayName || profile?.username}
								</p>
								{profile?.displayName &&
									profile.displayName !== profile.username && (
										<p className="text-xs text-muted-foreground leading-tight truncate mt-0.5 font-mono">
											@{profile.username}
										</p>
									)}
							</div>

							<ArrowRight className="size-3.5 text-sidebar-foreground/60 group-hover:text-sidebar-foreground transition-colors shrink-0" />
						</Link>
					</div>
				) : (
					<div className="rounded-xl border border-sidebar-border bg-card p-1">
						<Link
							href="/login"
							className="flex items-center gap-2.5 w-full min-h-11 px-3 rounded-lg text-muted-foreground hover:text-sidebar-foreground hover:bg-surface-soft transition-colors text-sm"
						>
							<User className="size-4 shrink-0" />
							<span className="font-medium">Sign in</span>
						</Link>
					</div>
				)}
			</SidebarFooter>
		</Sidebar>
	);
}
