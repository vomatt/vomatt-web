'use client';
import { RichText } from '@payloadcms/richtext-lexical/react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';

import AuthContainer from '@/components/auth/AuthContainer';
import { AuthFlow } from '@/components/auth/AuthFlow';
import { useLanguage } from '@/contexts/LanguageContext';

type SignUpType = {
	signUpInfoData: any;
};

export default function SignUp({ signUpInfoData }: SignUpType) {
	const { t } = useLanguage();
	const router = useRouter();
	const { policyMessage } = signUpInfoData || {};

	return (
		<AuthContainer type="STATUS_SIGN_UP">
			<AuthFlow
				variant="signup"
				onDone={() => router.replace('/')}
				footer={
					<>
						{policyMessage && (
							<div className="mt-8 text-xs text-muted-foreground">
								<RichText data={policyMessage} />
							</div>
						)}
						<hr className="w-full h-px my-8 bg-border border-0" />
						<p className="text-center text-sm">
							{t('signup.alreadyHaveAccount')}&nbsp;
							<NextLink href="/login" className="text-foreground underline underline-offset-4">
								{t('common.login')}
							</NextLink>
						</p>
					</>
				}
			/>
		</AuthContainer>
	);
}
