'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import AuthContainer from '@/components/auth/AuthContainer';
import {
	loginSchema,
	type LoginFormData,
} from '@/components/auth/auth-schemas';
import { useAuthFlow } from '@/components/auth/useAuthFlow';
import VerificationForm from '@/components/auth/VerificationForm';
import { ButtonLoading } from '@/components/ButtonLoading';
import { Field, FieldError, FieldLabel } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';
import { SYSTEM_ERROR } from '@/data/constants';

export function LogIn() {
	const flow = useAuthFlow();
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get('redirect') || '/';

	return (
		<AuthContainer type={flow.step === 'verification' ? 'STATUS_VERIFICATION' : 'STATUS_LOG_IN'}>
			{flow.step === 'verification' ? (
				<VerificationForm
					email={flow.email}
					backButtonFunc={flow.goBackToForm}
					submitCodeFunc={flow.handleLoginVerified}
					redirectTo={redirectTo}
				/>
			) : (
				<LogInForm onVerificationNeeded={flow.submitLoginEmail} />
			)}
		</AuthContainer>
	);
}

function LogInForm({
	onVerificationNeeded,
}: {
	onVerificationNeeded: (email: string) => Promise<{ status: string; errorType?: string }>;
}) {
	const { t } = useLanguage();
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const form = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: '' },
	});

	async function onSubmit(data: LoginFormData) {
		setIsLoading(true);
		setError('');

		try {
			const res = await onVerificationNeeded(data.email);

			if (res.status === 'SUCCESS') return;

			if (res.errorType === 'USER_NOT_FOUND') {
				return router.push('/signup');
			}

			setError(SYSTEM_ERROR);
		} catch {
			setError(SYSTEM_ERROR);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<>
			<h1 className="font-medium text-3xl text-center mb-10">
				{t('login.title')}
			</h1>

			<form onSubmit={form.handleSubmit(onSubmit)}>
				<Controller
					control={form.control}
					name="email"
					render={({ field, fieldState }) => {
						return (
							<Field className="mb-5">
								<FieldLabel htmlFor="loginEmail">
									{t('common.email')}
								</FieldLabel>
								<Input
									{...field}
									type="text"
									id="loginEmail"
									aria-invalid={fieldState.invalid}
									placeholder="m@example.com"
								/>
								{fieldState.invalid && (
									<FieldError>
										{t(`common.${fieldState.error?.message}`)}
									</FieldError>
								)}
							</Field>
						);
					}}
				/>
				<ButtonLoading className="w-full" type="submit" isLoading={isLoading}>
					{t('common.login')}
				</ButtonLoading>
				{error && (
					<p className="text-destructive text-center mt-3">
						{t(`login.${error}`)}
					</p>
				)}
			</form>

			<p className="mt-5 text-center">
				{t('login.footNote')}&nbsp;
				<NextLink
					href="/signup"
					className="cr-gray-900 underline underline-offset-4"
				>
					{t('common.signUp')}
				</NextLink>
			</p>
		</>
	);
}
