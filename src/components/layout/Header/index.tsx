'use client';

import { ArrowLeft } from 'lucide-react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import BrandLogo from '@/components/BrandLogo';
import SvgIcons from '@/components/SvgIcons';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Header({ data, userSession }: { data: any; userSession: any }) {
	const router = useRouter();
	const pathname = usePathname();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const hideLoginButton = ['/signup', '/login'].includes(pathname);
	const onToggleMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	useEffect(() => {
		setIsMobileMenuOpen(false);
	}, [router]);

	return (
		<>
			<header
				className={cn(
					'g-header w-full z-header px-contain bg-background/85 backdrop-blur-md fixed top-0 right-0 left-0 h-header',
					{
						'is-open': isMobileMenuOpen,
						'is-logged-in': userSession,
					}
				)}
			>
				<nav
					className={cn('flex  h-full py-4 px-5 items-center justify-center', {
						'justify-between': userSession,
					})}
				>
					<NextLink href="/" className="md:w-40 text-secondary-foreground w-28">
						<BrandLogo />
					</NextLink>

					{userSession && (
						<NextLink
							href={`/account`}
							className="text-white flex items-center gap-1"
						>
							<SvgIcons type="user-circle-outline" className="w-7 h-7" />
							<p>{userSession.sub}</p>
						</NextLink>
					)}
					{!userSession && !hideLoginButton && (
						<Button
							asChild
							size="sm"
							className="absolute right-contain lg:hidden"
						>
							<NextLink href="/login">Log in</NextLink>
						</Button>
					)}
					{/* {userSession && data?.menu?.items && (
						<Menu
							items={data.menu.items}
							className="g-header__links mobile-up-only cr-white"
							ulClassName="g-header__menu-list f-h f-a-c t-b-2 user-select-disable"
						/>
					)} */}
				</nav>
			</header>

			{/* <div
				className={clsx('mobile-menu', {
					'is-open': isMobileMenuOpen,
				})}
			>
				<MobileMenuTrigger
					isMobileMenuOpen={isMobileMenuOpen}
					onHandleClick={onToggleMenu}
				/>
				{data?.menu && (
					<Menu
						items={data?.menu?.items}
						className="mobile-menu-links"
						ulClassName="f-j f-a-c t-h-3"
					/>
				)}
			</div> */}
		</>
	);
}
