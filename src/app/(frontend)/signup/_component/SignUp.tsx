'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type {
	ControllerFieldState,
	ControllerRenderProps,
} from 'react-hook-form';

import AuthContainer from '@/components/auth/AuthContainer';
import {
	signupSchema,
	type SignupFormData,
} from '@/components/auth/auth-schemas';
import { useAuthFlow } from '@/components/auth/useAuthFlow';
import VerificationForm from '@/components/auth/VerificationForm';
import { ButtonLoading } from '@/components/ButtonLoading';
import { RichText } from '@payloadcms/richtext-lexical/react';
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldContent,
	FieldStatus,
} from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSessionStorage } from '@/hooks/useSessionStorage';

type SignUpType = {
	className?: string;
	signUpInfoData: any;
};

export default function SignUp({ signUpInfoData }: SignUpType) {
	const flow = useAuthFlow();

	return (
		<AuthContainer type={flow.step === 'verification' ? 'STATUS_VERIFICATION' : 'STATUS_SIGN_UP'}>
			{flow.step === 'verification' ? (
				<VerificationForm
					email={flow.email}
					backButtonFunc={flow.goBackToForm}
					submitCodeFunc={flow.handleSignupVerified}
				/>
			) : (
				<SignUpForm
					onVerificationNeeded={flow.submitSignupForm}
					signUpInfoData={signUpInfoData}
				/>
			)}
		</AuthContainer>
	);
}

function SignUpForm({
	onVerificationNeeded,
	signUpInfoData,
}: {
	onVerificationNeeded: (data: SignupFormData) => Promise<{ status: string; message?: string }>;
	signUpInfoData: any;
}) {
	const { t } = useLanguage();
	const [value] = useSessionStorage('login-email', '');

	const { policyMessage } = signUpInfoData || {};
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<SignupFormData>({
		resolver: zodResolver(signupSchema),
		defaultValues: { email: value || '', firstName: '', lastName: '', username: '' },
	});

	async function onSubmit(data: SignupFormData) {
		setIsLoading(true);
		setError('');
		try {
			const res = await onVerificationNeeded(data);

			if (res.status === 'SUCCESS') return;

			setError(res.message || 'Something went wrong');
		} catch {
			setError('Something went wrong, please try again later');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<>
			<h1 className="text-3xl mb-10 text-center">{t('signup.title')}</h1>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FieldGroup>
					<Controller
						name="email"
						control={form.control}
						render={({ field, fieldState }) => (
							<FormTextField
								field={field}
								fieldState={fieldState}
								id="signUpEmail"
								label={t('common.email')}
							/>
						)}
					/>
					<Controller
						name="firstName"
						control={form.control}
						render={({ field, fieldState }) => (
							<FormTextField
								field={field}
								fieldState={fieldState}
								id="signUpFirstName"
								label={t('common.firstName')}
								autoComplete="off"
							/>
						)}
					/>
					<Controller
						name="lastName"
						control={form.control}
						render={({ field, fieldState }) => (
							<FormTextField
								field={field}
								fieldState={fieldState}
								id="signUpLastName"
								label={t('common.lastName')}
								autoComplete="off"
							/>
						)}
					/>
					<Controller
						control={form.control}
						name="username"
						render={({ field, fieldState }) => (
							<FormTextField
								field={field}
								fieldState={fieldState}
								id="signUpUsername"
								label={t('common.username')}
								autoComplete="off"
							/>
						)}
					/>
				</FieldGroup>
				<ButtonLoading className="w-full" type="submit" isLoading={isLoading}>
					{t('signup.submit')}
				</ButtonLoading>
			</form>
			{error && <p className="t-l-1 text-destructive mt-3">{error}</p>}

			{policyMessage && (
				<div className="mt-10 text-sm">
					<RichText data={policyMessage} />
				</div>
			)}
			<hr className="w-full h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
			<div className="flex justify-center">
				<NextLink href="/login" className="cr-gray-900 underline">
					{t('signup.alreadyHaveAccount')}
				</NextLink>
			</div>
		</>
	);
}

function FormTextField({
	field,
	fieldState,
	id,
	label,
	autoComplete,
}: {
	field: ControllerRenderProps<SignupFormData>;
	fieldState: ControllerFieldState;
	id: string;
	label: string;
	autoComplete?: string;
}) {
	const [isFocused, setIsFocused] = useState(false);
	return (
		<Field data-invalid={fieldState.invalid}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<Input
				{...field}
				type="text"
				id={id}
				aria-invalid={fieldState.invalid}
				autoComplete={autoComplete}
				onFocus={() => setIsFocused(true)}
				onBlur={() => {
					field.onBlur();
					setIsFocused(false);
				}}
			/>
			<FieldStatus fieldState={fieldState} isFocused={isFocused} />
		</Field>
	);
}
