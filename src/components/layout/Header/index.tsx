'use client';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import { BrandLink } from '@/components/BrandLink';
import { HeaderStart } from '@/components/layout/HeaderStart';
import { MoreMenu } from '@/components/layout/MoreMenu';
import { buttonVariants } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { isChromeless } from '@/lib/routes';

type HeaderProps = {
	signedIn: boolean;
	/** Where Log in goes; carries `session_expired` when the API refused the session. */
	loginLink: string;
};

/** The phone header, fixed to the top: a page's way back, the logo centered, Log in for guests, and the More menu. Desktop has the sidebar. */
export function Header({ signedIn, loginLink }: HeaderProps) {
	const pathname = usePathname();
	const { t } = useLanguage();

	if (isChromeless(pathname)) return null;

	return (
		<header
			data-mobile-header
			data-nosnippet
			className="fixed inset-x-0 top-0 z-header grid h-header grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-background/80 backdrop-blur-lg px-contain pt-[env(safe-area-inset-top)] md:hidden"
		>
			<HeaderStart />
			<BrandLink className="w-20" />
			{/* The menu button's padding sits past the gutter, so its icon lines up with the page */}
			<div className="-mr-2.5 flex items-center justify-end gap-1">
				{!signedIn && (
					<NextLink href={loginLink} className={buttonVariants({ size: 'sm' })}>
						{t('loginPrompt.ctaLabel')}
					</NextLink>
				)}
				<MoreMenu signedIn={signedIn} placement="header" />
			</div>
		</header>
	);
}
