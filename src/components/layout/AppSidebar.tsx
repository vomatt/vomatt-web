'use client';
import { Home, LogOut, PlusCircle, TrendingUp, User } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import BrandLogo from '@/components/BrandLogo';
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
		url: '/',
		icon: Home,
	},
	{
		title: 'common.createPoll',
		url: '/',
		icon: PlusCircle,
	},
	{
		title: 'common.myPolls',
		url: '/',
		icon: TrendingUp,
	},
];

interface AppSidebarProps {
	userSession: any;
}

export function AppSidebar({ userSession }: AppSidebarProps) {
	const { t } = useLanguage();
	function handleLogout() {
		logout();
	}

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
									<SidebarMenuButton asChild>
										<Link
											href={item.url}
											className="flex items-center gap-3 px-4 py-3"
										>
											<item.icon className="w-5 h-5" />
											<span className="font-semibold">{t(item.title)}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			{userSession && (
				<SidebarFooter className="border-gray-100 p-4">
					<div className="space-y-3">
						<div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
							<div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
								<User className="w-5 h-5 text-white" />
							</div>

							<Link className="flex-1 min-w-0" href={`/account`}>
								<p className="font-semibold text-gray-900 text-sm truncate">
									{userSession.full_name}
								</p>
								<p className="text-xs text-gray-500 truncate">
									{userSession.email}
								</p>
							</Link>
						</div>
						<Button
							variant="outline"
							className="w-full justify-start gap-2"
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
