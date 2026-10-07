'use client';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthContainer from '@/components/auth/AuthContainer';
import { AuthFlow } from '@/components/auth/AuthFlow';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSafeRedirectPath } from '@/lib/utils';

export function LogIn() {
	const { t } = useLanguage();
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));
	const sessionExpired = searchParams.has('session_expired');

	return (
		<AuthContainer type="STATUS_LOG_IN">
			{sessionExpired && (
				<p role="status" className="mb-6 rounded-lg border border-border px-3 py-2.5 text-center text-sm text-muted-foreground">
					{t('login.sessionExpired')}
				</p>
			)}
			<AuthFlow
				variant="login"
				onDone={() => {
					router.replace(redirectTo);
					router.refresh();
				}}
				footer={
					<p className="mt-6 text-center text-sm">
						{t('login.footNote')}&nbsp;
						<NextLink href="/signup" className="text-foreground underline underline-offset-4">
							{t('common.signUp')}
						</NextLink>
					</p>
				}
			/>
		</AuthContainer>
	);
}
