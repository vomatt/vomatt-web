'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { HeadTrackingCode, Integrations } from '@/components/layout/HeadTrackingCode';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';

export const CONSENT_COOKIE = 'cookie-consent';
type Consent = 'granted' | 'denied';

function readConsent(): Consent | null {
	const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(granted|denied)`));
	return (match?.[1] as Consent) ?? null;
}

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/** Asks before loading analytics; renders nothing when no analytics ID is set in Sanity. */
export function CookieConsent({ integrations }: { integrations?: Integrations | null }) {
	const { t } = useLanguage();
	// undefined on the server, so the banner doesn't flash for returning visitors
	const consent = useSyncExternalStore(subscribe, readConsent, () => undefined);

	const hasAnalytics = !!(integrations?.gaIDs?.some(Boolean) || integrations?.gtmIDs?.some(Boolean));
	if (!hasAnalytics) return null;

	const choose = (value: Consent) => {
		document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`;
		listeners.forEach((listener) => listener());
	};

	if (consent === 'granted') return <HeadTrackingCode {...integrations} />;
	if (consent !== null) return null;

	return (
		<section
			aria-label={t('cookieConsent.label')}
			className="fixed inset-x-3 bottom-[calc(64px+env(safe-area-inset-bottom)+0.75rem)] z-50 rounded-lg border border-border bg-card p-4 shadow-lg md:inset-x-auto md:right-4 md:bottom-4 md:max-w-sm"
		>
			<p className="text-caption-1">
				{t('cookieConsent.message')}{' '}
				<Link href="/cookies-policy" className="underline underline-offset-2">
					{t('cookieConsent.policy')}
				</Link>
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

/** Clears the saved choice so the banner asks again; reloads if analytics already ran. */
export function CookieSettingsButton() {
	const { t } = useLanguage();

	const reopen = () => {
		const wasGranted = readConsent() === 'granted';
		document.cookie = `${CONSENT_COOKIE}=; path=/; max-age=0`;
		if (wasGranted) window.location.reload();
		else listeners.forEach((listener) => listener());
	};

	return (
		<Button variant="outline" className="mt-8" onClick={reopen}>
			{t('cookieConsent.settings')}
		</Button>
	);
}
