'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BrandLink } from '@/components/BrandLink';
import { MoreMenu } from '@/components/layout/MoreMenu';
import { Button, buttonVariants } from '@/components/ui/Button';
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
	Bell,
	Home,
	Lock,
	LogOut,
	PlusCircle,
	Search,
	User,
} from '@/components/ui/SvgIcons';
import { TidePanel } from '@/components/ui/TidePanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import {
	formatUnreadCount,
	useUnreadCount,
} from '@/features/notifications/UnreadCountProvider';
import { CreatePollTrigger } from '@/features/polls/components/CreatePollTrigger';
import { isActivePath, isChromeless, profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { MyProfile } from '@/types/user';

const navigationItems = [
	{
		title: 'common.home',
		url: '/',
		icon: Home,
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

export function AppSidebar({ userSession, profile }: AppSidebarProps) {
	const { t } = useLanguage();
	const pathname = usePathname();
	const { count: unreadCount } = useUnreadCount();

	if (isChromeless(pathname)) return null;

	// /account redirects to the profile; link there directly so the row shows as active
	const accountHref = profile ? profileHref(profile.username) : '/account';
	// Settings is reached from the profile, so the row stays active there too
	const accountCurrent =
		pathname === accountHref
			? 'page'
			: pathname === '/settings'
				? 'true'
				: undefined;

	return (
		<Sidebar className="border-sidebar-border">
			{/* Header */}
			<SidebarHeader className="px-5 pt-5 pb-5">
				<BrandLink className="w-24 text-sidebar-foreground hover:text-sidebar-foreground/70 transition-colors" />
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
					<Link
						href="/login"
						className={cn(buttonVariants({ variant: 'create' }), 'w-full')}
					>
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
												'group h-9 rounded-lg px-3 cursor-pointer transition-colors duration-150',
												'text-muted-foreground hover:text-sidebar-foreground',
												isActive &&
													'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent'
											)}
										>
											<item.icon className="size-5 shrink-0" />
											<span className="text-sm font-medium capitalize">
												{t(item.title)}
											</span>
											{badge > 0 && (
												<span className="ml-auto min-w-5 rounded-full bg-alert px-1.5 text-center font-mono text-[10px] font-semibold leading-5 text-alert-foreground tabular-nums">
													{formatUnreadCount(badge)}
												</span>
											)}
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
							{userSession && (
								<SidebarMenuItem>
									<SidebarMenuButton
										render={
											<Link
												href={accountHref}
												aria-current={accountCurrent}
												className="flex items-center gap-3 w-full"
											/>
										}
										className={cn(
											'group h-9 rounded-lg px-3 cursor-pointer transition-colors duration-150',
											'text-muted-foreground hover:text-sidebar-foreground',
											accountCurrent &&
												'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent'
										)}
									>
										{profile ? (
											<UserAvatar
												username={profile.username}
												avatarUrl={profile.avatarUrl}
												className="size-5 shrink-0"
											/>
										) : (
											<User className="size-5 shrink-0" />
										)}
										<span className="text-sm font-medium capitalize">
											{t('navigation.profile')}
										</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* The rules in one line, where every page can see them */}
				<TidePanel className="mx-1 mt-5 p-3.5 text-[12px] leading-relaxed">
					<p className="mb-1 flex items-center gap-1.5 font-medium">
						<Lock aria-hidden className="size-3.5 shrink-0 text-tide" />
						{t('navigation.howCountsTitle')}
					</p>
					<p>{t('navigation.howCountsBody')}</p>
				</TidePanel>
			</SidebarContent>

			{/* Footer */}
			<SidebarFooter className="px-3 py-10 gap-2">
				{!userSession && (
					<div className="rounded-xl border border-sidebar-border bg-card p-1">
						<Link
							href="/login"
							className="flex items-center gap-2.5 w-full h-9 px-3 rounded-lg text-muted-foreground hover:text-sidebar-foreground transition-colors duration-150 text-sm outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
						>
							<User className="size-4 shrink-0" />
							<span className="font-medium">{t('loginPrompt.ctaLabel')}</span>
						</Link>
					</div>
				)}
				{/* In a menu so More gets the nav rows' hover mark */}
				<SidebarMenu>
					<SidebarMenuItem>
						<MoreMenu signedIn={Boolean(userSession)} />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
