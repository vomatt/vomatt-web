import cx from 'classnames';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, {
	ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import BrandLogo from '@/components/BrandLogo';
import Button from '@/components/Button';
import Menu from '@/components/Menu';
import SvgIcons from '@/components/SvgIcons';

import MobileMenuTrigger from './mobile-menu-trigger';

export default function Header({
	data,
	userSession,
}: {
	data: any;
	userSession: any;
}) {
	const router = useRouter();
	const pathname = usePathname();

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
				className={cx('g-header py-3 relative w-full z-100 px-contain ', {
					'is-open': isMobileMenuOpen,
					'is-logged-in': userSession,
				})}
			>
				<nav className="flex bg-gray-800 rounded-lg h-full pt-4 pb-6 px-6 justify-between items-center">
					<NextLink href="/" className="w-[160px] text-white">
						<BrandLogo />
					</NextLink>
					{!userSession && (
						<Button size="sm">
							<NextLink href={`/login?from=${pathname}`}>Login</NextLink>
						</Button>
					)}
					{userSession && (
						<NextLink href={`/account`} className="w-7 h-7 text-white">
							<SvgIcons type="user-circle-outline" />
						</NextLink>
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
				className={cx('mobile-menu', {
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
