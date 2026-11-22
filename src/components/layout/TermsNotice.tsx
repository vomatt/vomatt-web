'use client';

import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';

import { reserveBannerSpace } from '@/components/layout/CookieConsent';
import { Button } from '@/components/ui/Button';
import { X } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKeyboardOpen } from '@/hooks/useVisualViewport';
import { aboutHref } from '@/lib/aboutSite';
import { readCookie, sharedCookie } from '@/lib/cookies';
import { rich } from '@/lib/rich';
import { isChromeless } from '@/lib/routes';

export const TERMS_NOTICE_COOKIE = 'terms-notice-dismissed';

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

const readDismissed = () => readCookie(TERMS_NOTICE_COOKIE) === '1';

/** Tells a signed-out visitor that using vomatt means agreeing to its Terms and Privacy Policy, until they dismiss it. */
export function TermsNotice() {
	const { t, currentLanguage } = useLanguage();
	// Dismissed on the server, so it doesn't flash for visitors who closed it
	const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
	const keyboardOpen = useKeyboardOpen();
	const pathname = usePathname();

	// Log in carries its own policy line
	if (dismissed || isChromeless(pathname)) return null;

	const link = (slug: string, label: string) => (
		<a href={aboutHref(slug, currentLanguage)} className="font-semibold underline-offset-2 hover:underline">
			{label}
		</a>
	);
	const dismiss = () => {
		document.cookie = sharedCookie(TERMS_NOTICE_COOKIE, '1', window.location.hostname);
		listeners.forEach((listener) => listener());
	};

	return (
		<section
			ref={reserveBannerSpace}
			aria-label={t('termsNotice.label')}
			data-keyboard={keyboardOpen || undefined}
			// A card above the TabBar on phones; from md a bar along the bottom of the content, clear of the sidebar
			className="data-keyboard:invisible fixed inset-x-3 bottom-[calc(var(--tabbar-space)+0.75rem)] z-50 flex items-start gap-2 rounded-2xl border border-border bg-card/80 py-3 pr-2 pl-4 shadow-lg backdrop-blur-lg md:inset-x-auto md:right-0 md:bottom-0 md:left-(--sidebar-width) md:items-center md:rounded-none md:border-x-0 md:border-b-0 md:pr-4 md:pb-[max(--spacing(3),env(safe-area-inset-bottom))] md:pl-6 md:shadow-none"
		>
			<p className="min-w-0 flex-1 self-center text-caption-1 md:text-body-4">
				{rich(t('termsNotice.message'), {
					terms: link('terms-of-service', t('termsNotice.terms')),
					privacy: link('privacy-policy', t('termsNotice.privacy')),
				})}
			</p>
			<Button variant="ghost" size="icon-xs" aria-label={t('termsNotice.dismiss')} onClick={dismiss} className="shrink-0">
				<X aria-hidden />
			</Button>
		</section>
	);
}
