import cx from 'classnames';
import { useRouter } from 'next/navigation';
import React, {
	ReactNode,
	useEffect,
	useRef,
	useCallback,
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
				<div className="g-header__interior f-h f-a-c bg-chrome">
					<BrandLogo />
					{data?.menu?.items && (
						<Menu
							items={data.menu.items}
							className="g-header__links mobile-up-only"
							ulClassName="f-h f-a-c t-b-2 user-select-disable"
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

			<style global jsx>{`
				.g-header {
					position: relative;
					width: 100%;
					padding: 10px var(--s-contain);
					z-index: 100;
				}

				.header-links {
					ul {
						gap: 10px;
					}
				}

				.mobile-menu {
					position: fixed;
					width: 100%;
					height: 100%;
					overflow-y: auto;
					top: 0;
					right: 0;
					padding: 20px var(--s-edge);
					transform: translate3d(100%, 0px, 0px);
					background-color: var(--cr-white);
					transition: transform 0.3s var(--e-inOut-circ);
					z-index: 120;

					&.is-open {
						transform: translate3d(0px, 0px, 0px);
					}

					.mobile-menu-links {
						gap: 10px;
					}
				}
			`}</style>
		</>
	);
}

export default Header;
