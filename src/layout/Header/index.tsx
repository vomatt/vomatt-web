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

function Header({ data }) {
	const router = useRouter();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const headerRef = useCallback((node: HTMLElement | null) => {
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
				className={cx('g-header', {
					'is-open': isMobileMenuOpen,
				})}
			>
				<div className="g-header__interior f-h f-a-c bg-surface-grey-darker">
					<NextLink href="/" className="g-header__logo-link cr-white">
						<BrandLogo />
					</NextLink>
					{data?.menu?.items && (
						<Menu
							items={data.menu.items}
							className="g-header__links mobile-up-only cr-white"
							ulClassName="g-header__menu-list f-h f-a-c t-b-2 user-select-disable"
						/>
					)}
				</div>
			</header>

			<div
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
			</div>
		</>
	);
}

export default Header;
