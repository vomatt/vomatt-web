'use client';
import { Calendar, Plus, X } from 'lucide-react';
import { Home, LogOut, PlusCircle, Search, TrendingUp, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import BrandLogo from '@/components/BrandLogo';
import { PollCreator } from '@/components/PollCreator';
import { Button } from '@/components/ui/Button';
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
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/Sidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { logout } from '@/lib/auth';
import { cn, hasArrayValue } from '@/lib/utils';

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

export function AppSidebar({ userSession }: AppSidebarProps) {
	const { t } = useLanguage();
	const pathname = usePathname();

	function handleLogout() {
		logout();
	}

	if (hideSideBarFromPages.includes(pathname)) return null;

	return (
		<Sidebar className="border-none backdrop-blur-lg" variant="floating">
			<SidebarHeader className="px-6 py-4">
				<Link href="/" className="w-28 text-secondary-foreground">
					<BrandLogo />
				</Link>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{navigationItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild={item.id !== 'actionCreatePoll'}
										className="cursor-pointer"
									>
										{item.id === 'actionCreatePoll' ? (
											<PollCreator
												triggerChildren={
													<div className="flex items-center gap-3 w-full">
														<item.icon className="size-4" />
														<span className="font-semibold">
															{t(item.title)}
														</span>
													</div>
												}
											/>
										) : (
											<Link href={item.url} className="flex items-center gap-3">
												<item.icon className="size-4" />
												<span className="font-semibold">{t(item.title)}</span>
											</Link>
										)}
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			{userSession && (
				<SidebarFooter className="border-t border-border/40 p-4">
					<div className="space-y-3">
						<div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/40">
							<div className="w-9 h-9 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30 flex-shrink-0">
								<User className="w-4 h-4 text-amber-400" />
							</div>

							<Link className="flex-1 min-w-0" href={`/account`}>
								<p className="font-semibold text-foreground text-sm truncate">
									{userSession.full_name}
								</p>
								<p className="text-xs text-muted-foreground truncate">
									{userSession.email}
								</p>
							</Link>
						</div>
						<Button
							variant="ghost"
							className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
							onClick={handleLogout}
						>
							<LogOut className="w-4 h-4" />
							Logout
						</Button>
					</div>
				</SidebarFooter>
			)}
		</Sidebar>
	);
}
