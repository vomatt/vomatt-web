'use client';
import type { PortableTextBlock } from '@portabletext/react';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthContainer from '@/components/auth/AuthContainer';
import { AuthFlow } from '@/components/auth/AuthFlow';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSafeRedirectPath } from '@/lib/routes';

export function LogIn({ policyMessage }: { policyMessage?: PortableTextBlock[] | null }) {
	const { t } = useLanguage();
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));
	const sessionExpired = searchParams.get('session_expired');

	return (
		<AuthContainer>
			{sessionExpired && (
				// Plain text ahead of the title: it is there from the first paint, which a live region
				// wouldn't announce, and reading order reaches it first
				<p className="mb-6 rounded-[10px] border border-border bg-card px-3.5 py-3 text-[14px] text-foreground">
					{t(
						sessionExpired === 'security'
							? 'login.sessionRevoked'
							: sessionExpired === 'deleted'
								? 'login.accountDeleted'
								: 'login.sessionExpired'
					)}
				</p>
			)}
			<AuthFlow onDone={() => router.replace(redirectTo)} policyMessage={policyMessage} />
		</AuthContainer>
	);
}
