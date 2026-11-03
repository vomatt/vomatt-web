'use client';

import { usePathname, useRouter } from 'next/navigation';
import { startTransition, useEffect, useState, useSyncExternalStore } from 'react';

import BrandLogo from '@/components/BrandLogo';
import { EmptyCard } from '@/components/EmptyCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { SESSION_PROBE_HEADER, SESSION_UNCONFIRMED } from '@/data/constants';

// About 15s in all, longer than vomatt-api usually takes to wake
const RETRY_DELAYS = [1500, 4000, 10000];

const subscribeNothing = () => () => {};

/** True once the proxy could settle the session: refreshed, or known to be over. */
async function sessionSettled() {
	try {
		const res = await fetch(window.location.href, {
			headers: { [SESSION_PROBE_HEADER]: '1' },
			cache: 'no-store',
		});
		return res.status !== 503;
	} catch {
		return false;
	}
}

/**
 * Rendered in place of a page while the proxy couldn't reach the API to refresh
 * the session, or the layout couldn't load the profile, so a signed-in person
 * never sees the page signed out. It probes
 * the proxy until the session settles, then refreshes to render the page.
 * After the last try it says so and offers another round.
 */
export function SessionRetry() {
	const router = useRouter();
	const { t } = useLanguage();
	const [tries, setTries] = useState(0);
	const gaveUp = tries >= RETRY_DELAYS.length;
	// Live regions announce text added after they mount, not text in the server HTML
	const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);

	useEffect(() => {
		if (gaveUp) return;
		let cancelled = false;
		const timer = setTimeout(async () => {
			const settled = await sessionSettled();
			if (cancelled) return;
			// Once settled the refresh renders the page and this unmounts. It stays when the
			// layout still can't load the profile, so the refresh counts as a try. One transition
			// commits both together, so the give-up card can't flash before the page arrives.
			if (settled) {
				startTransition(() => {
					router.refresh();
					setTries((n) => n + 1);
				});
			} else setTries((n) => n + 1);
		}, RETRY_DELAYS[tries]);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [tries, gaveUp, router]);

	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-5 px-4">
			{gaveUp ? (
				<EmptyCard
					className="w-full max-w-feed"
					headingLevel={1}
					title={t('common.error')}
					body={t('common.errorBody')}
					action={<Button onClick={() => setTries(0)}>{t('common.tryAgain')}</Button>}
				/>
			) : (
				<>
					<BrandLogo className="w-28 text-foreground" />
					<Skeleton className="h-1 w-16 rounded-full" />
				</>
			)}
			<p role="status" className="sr-only">
				{hydrated && !gaveUp ? t('common.signingIn') : null}
			</p>
		</div>
	);
}

/**
 * In the app shell, which a client navigation doesn't re-render: a navigation the
 * proxy answered while the session was unconfirmed reloads, so the root layout
 * shows SessionRetry instead of the page signed out.
 */
export function ReloadWhenSessionUnconfirmed() {
	const pathname = usePathname();
	useEffect(() => {
		if (document.cookie.split('; ').includes(`${SESSION_UNCONFIRMED}=1`)) window.location.reload();
	}, [pathname]);
	return null;
}
