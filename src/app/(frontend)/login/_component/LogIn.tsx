'use client';
import type { PortableTextBlock } from '@portabletext/react';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthContainer from '@/components/auth/AuthContainer';
import { AuthFlow } from '@/components/auth/AuthFlow';
import CustomPortableText from '@/components/CustomPortableText';
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
				<p role="status" className="mb-6 rounded-lg border border-border bg-card px-3.5 py-3 text-sm text-foreground">
					{t(sessionExpired === 'security' ? 'login.sessionRevoked' : 'login.sessionExpired')}
				</p>
			)}
			<AuthFlow
				onDone={() => router.replace(redirectTo)}
				footer={
					policyMessage && (
						<div className="mt-8 text-xs text-muted-foreground">
							<CustomPortableText blocks={policyMessage} />
						</div>
					)
				}
			/>
		</AuthContainer>
	);
}
