'use client';

import {
	ArrowRight,
	Home,
	LogOut,
	PlusCircle,
	Search,
	TrendingUp,
	User,
} from '@/components/ui/SvgIcons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import dynamic from 'next/dynamic';
import BrandLogo from '@/components/BrandLogo';

const PollCreator = dynamic(
	() =>
		import('@/components/PollCreator').then((m) => ({
			default: m.PollCreator,
		})),
	{ ssr: false }
);

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
import { useLanguage } from '@/contexts/LanguageContext';
import { logout } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

const navigationItems = [
	{
		title: 'common.home',
		id: 'linkHome',
		url: '/',
		icon: Home,
	},
	{
		title: 'common.createPoll',
		id: 'actionCreatePoll',
		url: '/',
		icon: PlusCircle,
	},
	{
		title: 'common.myPolls',
		id: 'linkMyPolls',
		url: '/my-polls',
		icon: TrendingUp,
	},
	{
		title: 'common.explore',
		id: 'linkExplore',
		url: '/explore',
		icon: Search,
	},
];

interface AppSidebarProps {
	userSession: any;
}

const hideSideBarFromPages = ['/login', '/signup'];

function getUserInitials(fullName?: string, email?: string): string {
	if (fullName) {
		const parts = fullName.trim().split(/\s+/);
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		}
		return fullName.slice(0, 2).toUpperCase();
	}
	if (email) return email[0].toUpperCase();
	return 'U';
}

export function AppSidebar({ userSession }: AppSidebarProps) {
	const { t } = useLanguage();
	const pathname = usePathname();

	function handleLogout() {
		logout();
	}

	if (hideSideBarFromPages.includes(pathname)) return null;

	const initials = getUserInitials(userSession?.full_name, userSession?.email);

	return (
		<Sidebar className="border-none" variant="floating">
			{/* Header */}
			<SidebarHeader className="px-5 pt-5 pb-5">
				<Link
					href="/"
					className="block w-24 text-foreground hover:text-foreground/70 transition-colors"
				>
					<BrandLogo />
				</Link>
			</SidebarHeader>

			{/* Nav */}
			<SidebarContent className="px-2">
				<SidebarGroup className="p-0">
					<SidebarGroupContent>
						<SidebarMenu className="gap-0.5">
							{navigationItems.map((item) => {
								const isActive =
									item.id !== 'actionCreatePoll' &&
									(item.url === '/'
										? pathname === '/'
										: pathname.startsWith(item.url));

								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											asChild={item.id !== 'actionCreatePoll' || !userSession}
											className={cn(
												'group h-9 rounded-lg px-3 cursor-pointer transition-all duration-150',
												'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
												isActive &&
													'bg-sidebar-accent text-sidebar-accent-foreground font-medium hover:bg-sidebar-accent'
											)}
										>
											{item.id === 'actionCreatePoll' ? (
												userSession ? (
													<PollCreator
														triggerChildren={
															<div className="flex items-center gap-3 w-full">
																<item.icon
																	className={cn(
																		'size-4 transition-colors',
																		'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'
																	)}
																/>
																<span className="text-sm font-medium">
																	{t(item.title)}
																</span>
															</div>
														}
													/>
												) : (
													<Link
														href="/login"
														className="flex items-center gap-3 w-full"
													>
														<item.icon
															className={cn(
																'size-4 transition-colors',
																'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'
															)}
														/>
														<span className="text-sm font-medium">
															{t(item.title)}
														</span>
													</Link>
												)
											) : (
												<Link
													href={item.url}
													className="flex items-center gap-3 w-full"
												>
													<item.icon
														className={cn(
															'size-4 shrink-0 transition-colors',
															isActive
																? 'text-sidebar-primary'
																: 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'
														)}
													/>
													<span className="text-sm font-medium capitalize">
														{t(item.title)}
													</span>
													{isActive && (
														<span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary shrink-0" />
													)}
												</Link>
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
					<div className="rounded-xl border border-sidebar-border/60 bg-sidebar-accent/20 overflow-hidden">
						<Link
							href="/account"
							className={cn(
								'group flex items-center gap-3 p-3 transition-colors',
								'hover:bg-sidebar-accent/40',
								pathname === '/account' && 'bg-sidebar-accent/40'
							)}
						>
							<div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0 shadow-sm">
								<span className="text-sidebar-primary-foreground text-xs font-bold tracking-wide">
									{initials}
								</span>
							</div>

							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold text-sidebar-foreground leading-tight truncate">
									{userSession.full_name || userSession.email}
								</p>
								{userSession.full_name && (
									<p className="text-[11px] text-sidebar-foreground/50 leading-tight truncate mt-0.5">
										{userSession.email}
									</p>
								)}
							</div>

							<ArrowRight className="size-3.5 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60 transition-colors shrink-0" />
						</Link>
						<div className="border-t border-sidebar-border/40">
							<button
								onClick={handleLogout}
								className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-colors text-sm"
							>
								<LogOut className="size-3.5 shrink-0" />
								<span className="font-medium">Sign out</span>
							</button>
						</div>
					</div>
				) : (
					<div className="rounded-xl border border-sidebar-border/60 bg-sidebar-accent/20 p-3">
						<Link
							href="/login"
							className="flex items-center gap-2.5 w-full text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors text-sm"
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
