'use client';
import type { PortableTextBlock } from '@portabletext/react';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthContainer from '@/components/auth/AuthContainer';
import { AuthFlow } from '@/components/auth/AuthFlow';
import { useLanguage } from '@/contexts/LanguageContext';
import { COMMUNITY_INVITATIONS_PATH } from '@/features/communities/schema';
import { getSafeRedirectPath } from '@/lib/routes';

export function LogIn({ policyMessage }: { policyMessage?: PortableTextBlock[] | null }) {
	const { t } = useLanguage();
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));
	const sessionExpired = searchParams.get('session_expired');
	// One note at most: why the session ended, else, when a community invitation email sent them here,
	// that only the address it went to can open it
	const note = sessionExpired
		? sessionExpired === 'security'
			? 'login.sessionRevoked'
			: sessionExpired === 'deleted'
				? 'login.accountDeleted'
				: sessionExpired === 'revoked'
					? 'login.signedOutHere'
					: 'login.sessionExpired'
		: redirectTo.startsWith(COMMUNITY_INVITATIONS_PATH)
			? 'login.communityInvitation'
			: null;

	return (
		<AuthContainer>
			{note && (
				// Plain text ahead of the title: it is there from the first paint, which a live region
				// wouldn't announce, and reading order reaches it first
				<p className="mb-6 rounded-[10px] border border-border bg-card px-3.5 py-3 text-body-4 text-foreground">{t(note)}</p>
			)}
			<AuthFlow onDone={() => router.replace(redirectTo)} policyMessage={policyMessage} />
		</AuthContainer>
	);
}
