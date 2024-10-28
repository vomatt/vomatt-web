import cx from 'classnames';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import React, {
	ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import BrandLogo from '@/components/BrandLogo';
import Menu from '@/components/Menu';

import MobileMenuTrigger from './mobile-menu-trigger';

export default function Header({ data, userSession }) {
	const router = useRouter();
	const isLoggedIn = userSession;
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
				className={cx('g-header py-2.5 relative w-full z-100 px-contain', {
					'is-open': isMobileMenuOpen,
					'is-logged-in': isLoggedIn,
				})}
			>
				<div
					className={cx(
						'flex justify-center rounded p-7 bg-grey-900 rounded-2xl',
						{
							'f-j-c': !isLoggedIn,
						}
					)}
				>
					<NextLink href="/">
						<BrandLogo className="w-40 text-white" />
					</NextLink>

					{isLoggedIn && data?.menu?.items && (
						<Menu
							items={data.menu.items}
							className="g-header__links mobile-up-only cr-white"
							ulClassName="g-header__menu-list f-h f-a-c t-b-2 user-select-disable"
						/>
					)}
				</div>
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
