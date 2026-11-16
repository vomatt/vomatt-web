'use client';

import { CookieConsent, hasAnalytics, useConsent } from '@/components/layout/CookieConsent';
import type { Integrations } from '@/components/layout/HeadTrackingCode';
import { TermsNotice } from '@/components/layout/TermsNotice';

/** The prompts at the bottom of the screen, one at a time: the analytics question while it is unanswered, then the terms notice for signed-out visitors. */
export function BottomPrompt({ integrations, signedIn }: { integrations?: Integrations | null; signedIn: boolean }) {
	const consent = useConsent();
	// The consent cookie is unread on the server; the notice waits for it so the two never show together
	const consentSettled = consent !== undefined && !(hasAnalytics(integrations) && consent === null);

	return (
		<>
			<CookieConsent integrations={integrations} />
			{!signedIn && consentSettled && <TermsNotice />}
		</>
	);
}
