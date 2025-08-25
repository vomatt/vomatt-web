'use client';
import clsx from 'clsx';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import BrandLogo from '@/components/BrandLogo';
import SvgIcons from '@/components/SvgIcons';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Header({ data, userSession }: { data: any; userSession: any }) {
	const router = useRouter();

	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const headerRef = useCallback((node: HTMLElement | null) => {
		if (!node) return;

		const headerHeight = node.getBoundingClientRect().height;
		document.documentElement.style.setProperty(
			'--s-header',
			`${headerHeight}px`
		);
	}, []);

	const onToggleMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	useEffect(() => {
		setIsMobileMenuOpen(false);
	}, [router]);

	return (
		<>
			<header
				ref={headerRef}
				className={clsx(
					'g-header py-3 relative w-full z-100 px-contain bg-background/85 backdrop-blur-xl',
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
					<NextLink href="/" className="w-[160px] text-secondary-foreground">
						<BrandLogo />
					</NextLink>

					{userSession && (
						<NextLink href={`/account`} className="w-7 h-7 text-white">
							<SvgIcons type="user-circle-outline" />
						</NextLink>
					)}
					{!userSession && (
						<Button
							asChild
							size="sm"
							className="absolute right-contain md:hidden"
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
