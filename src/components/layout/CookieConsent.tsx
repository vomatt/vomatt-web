'use client';

import { useSyncExternalStore } from 'react';

import { HeadTrackingCode, Integrations } from '@/components/layout/HeadTrackingCode';
import { rowClassName, RowText } from '@/components/SettingsCard';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKeyboardOpen } from '@/hooks/useVisualViewport';
import { aboutHref } from '@/lib/aboutSite';
import { cn } from '@/lib/utils';

export const CONSENT_COOKIE = 'cookie-consent';
type Consent = 'granted' | 'denied';

/** The consent cookie, set on vomatt.com so the app and about.vomatt.com share one answer. Mirrors vomatt-about's. */
export function consentCookie(value: Consent | '', hostname: string) {
	const shared = hostname === 'vomatt.com' || hostname.endsWith('.vomatt.com');
	const maxAge = value ? 365 * 24 * 60 * 60 : 0;
	return `${CONSENT_COOKIE}=${value}; path=/; max-age=${maxAge}; samesite=lax${shared ? '; domain=vomatt.com' : ''}`;
}

function readConsent(): Consent | null {
	const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(granted|denied)`));
	return (match?.[1] as Consent) ?? null;
}

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

const hasAnalytics = (integrations?: Integrations | null) =>
	!!(integrations?.gaIDs?.some(Boolean) || integrations?.gtmIDs?.some(Boolean));

/** Publishes the room the banner takes from the viewport's bottom, so the Toaster (root layout) stacks toasts above it */
function reserveBannerSpace(banner: HTMLElement) {
	const root = document.documentElement;
	const observer = new ResizeObserver(() => {
		root.style.setProperty('--cookie-banner-space', `${window.innerHeight - banner.getBoundingClientRect().top}px`);
	});
	observer.observe(banner);
	return () => {
		observer.disconnect();
		root.style.removeProperty('--cookie-banner-space');
	};
}

/** Asks before loading analytics; renders nothing when no analytics ID is set in Sanity. */
export function CookieConsent({ integrations }: { integrations?: Integrations | null }) {
	const { t, currentLanguage } = useLanguage();
	// undefined on the server, so the banner doesn't flash for returning visitors
	const consent = useSyncExternalStore(subscribe, readConsent, () => undefined);
	const keyboardOpen = useKeyboardOpen();

	if (!hasAnalytics(integrations)) return null;

	const choose = (value: Consent) => {
		document.cookie = consentCookie(value, window.location.hostname);
		listeners.forEach((listener) => listener());
	};

	if (consent === 'granted') return <HeadTrackingCode {...integrations} />;
	if (consent !== null) return null;

	return (
		<section
			ref={reserveBannerSpace}
			aria-label={t('cookieConsent.label')}
			// Like the TabBar it sits on, it stays behind a keyboard instead of riding up above it
			data-keyboard={keyboardOpen || undefined}
			className="data-keyboard:invisible fixed inset-x-3 bottom-[calc(64px+env(safe-area-inset-bottom)+0.75rem)] z-50 rounded-lg border border-border bg-card p-4 shadow-lg md:inset-x-auto md:right-[max(--spacing(4),env(safe-area-inset-right))] md:bottom-[max(--spacing(4),env(safe-area-inset-bottom))] md:max-w-sm"
		>
			<p className="text-caption-1">
				{t('cookieConsent.message')}{' '}
				<a href={aboutHref('privacy-policy', currentLanguage)} className="underline underline-offset-2">
					{t('cookieConsent.policy')}
				</a>
			</p>
			<div className="mt-3 flex gap-2">
				<Button size="sm" onClick={() => choose('granted')}>
					{t('cookieConsent.accept')}
				</Button>
				<Button size="sm" variant="outline" onClick={() => choose('denied')}>
					{t('cookieConsent.decline')}
				</Button>
			</div>
		</section>
	);
}

const CHOICE_TEXT = {
	granted: 'settings.analyticsCookiesGranted',
	denied: 'settings.analyticsCookiesDenied',
	null: 'settings.analyticsCookiesUnset',
} as const;

/** A Settings row showing the analytics cookie choice, with a way to make it again; nothing when no analytics ID is set. */
export function CookieChoiceRow({ integrations }: { integrations?: Integrations | null }) {
	const { t } = useLanguage();
	const consent = useSyncExternalStore(subscribe, readConsent, () => undefined);

	if (!hasAnalytics(integrations)) return null;

	const askAgain = () => {
		document.cookie = consentCookie('', window.location.hostname);
		// Loaded analytics scripts stay until the page reloads
		if (consent === 'granted') window.location.reload();
		else listeners.forEach((listener) => listener());
	};

	return (
		<div className={cn(rowClassName, 'flex-wrap')}>
			<RowText
				title={t('settings.analyticsCookies')}
				body={consent !== undefined && t(CHOICE_TEXT[`${consent}`])}
			/>
			{consent && (
				<Button variant="outline" size="md" onClick={askAgain}>
					{t('settings.analyticsCookiesChange')}
				</Button>
			)}
		</div>
	);
}
