'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { ButtonLoading } from '@/components/ButtonLoading';
import { Button } from '@/components/ui/Button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AuthErrorKey } from '@/lib/api/auth-errors';

import {
	type EmailFormData,
	emailSchema,
	type ProfileFormData,
	profileSchema,
} from './auth-schemas';
import { type AuthResult, useAuthFlow } from './useAuthFlow';
import VerificationForm from './VerificationForm';

type AuthFlowProps = {
	/** Only changes the wording of the first step; both create or sign in. */
	variant: 'login' | 'signup';
	/** Called once the user is signed in (and, for a new account, past the profile step). */
	onDone: () => void;
	/** Rendered under the email step, e.g. a link to the other page or the terms. */
	footer?: React.ReactNode;
};

export function AuthFlow({ variant, onDone, footer }: AuthFlowProps) {
	const flow = useAuthFlow();

	if (flow.step === 'code') {
		return (
			<VerificationForm
				email={flow.email}
				onSubmitCode={async (code) => {
					const res = await flow.submitCode(code);
					if (res.status === 'OK' && res.done) onDone();
					return res;
				}}
				onResend={flow.resendCode}
				onEditEmail={flow.editEmail}
			/>
		);
	}

	if (flow.step === 'profile') {
		return <ProfileStep email={flow.email} onSave={flow.submitProfile} onDone={onDone} />;
	}

	return (
		<>
			<EmailStep variant={variant} defaultEmail={flow.email} onSubmit={flow.submitEmail} />
			{footer}
		</>
	);
}

function EmailStep({
	variant,
	defaultEmail,
	onSubmit,
}: {
	variant: AuthFlowProps['variant'];
	defaultEmail: string;
	onSubmit: (email: string) => Promise<AuthResult>;
}) {
	const { t } = useLanguage();
	const [error, setError] = useState<AuthErrorKey | null>(null);
	const form = useForm<EmailFormData>({
		resolver: zodResolver(emailSchema),
		defaultValues: { email: defaultEmail },
	});

	async function submit({ email }: EmailFormData) {
		setError(null);
		const res = await onSubmit(email);
		if (res.status === 'ERROR') setError(res.error);
	}

	return (
		<>
			<h1 className="font-medium text-3xl text-center mb-3">{t(`${variant}.title`)}</h1>
			<p className="text-center text-sm text-muted-foreground mb-8">{t(`${variant}.subtitle`)}</p>
			<form onSubmit={form.handleSubmit(submit)} noValidate>
				<Controller
					control={form.control}
					name="email"
					render={({ field, fieldState }) => (
						<Field className="mb-5" data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="authEmail">{t('common.email')}</FieldLabel>
							<Input
								{...field}
								type="email"
								id="authEmail"
								autoComplete="email"
								autoFocus
								aria-invalid={fieldState.invalid}
								placeholder="you@example.com"
							/>
							{fieldState.invalid && (
								<FieldError>{t(`${fieldState.error?.message}`)}</FieldError>
							)}
						</Field>
					)}
				/>
				<ButtonLoading className="w-full" type="submit" isLoading={form.formState.isSubmitting}>
					{t('auth.continueWithEmail')}
				</ButtonLoading>
				{error && (
					<p role="alert" className="text-destructive text-center mt-3 text-sm">
						{t(`authError.${error}`)}
					</p>
				)}
				<p className="text-center text-xs text-muted-foreground mt-4">{t('auth.passwordless')}</p>
			</form>
		</>
	);
}

function ProfileStep({
	email,
	onSave,
	onDone,
}: {
	email: string;
	onSave: (displayName: string) => Promise<AuthResult>;
	onDone: () => void;
}) {
	const { t } = useLanguage();
	const [error, setError] = useState<AuthErrorKey | null>(null);
	const form = useForm<ProfileFormData>({
		resolver: zodResolver(profileSchema),
		defaultValues: { displayName: email.split('@')[0] ?? '' },
	});

	async function submit({ displayName }: ProfileFormData) {
		setError(null);
		const res = await onSave(displayName);
		if (res.status === 'ERROR') {
			setError(res.error);
			return;
		}
		onDone();
	}

	return (
		<>
			<h1 className="font-medium text-3xl text-center mb-3">{t('onboarding.title')}</h1>
			<p className="text-center text-sm text-muted-foreground mb-8">{t('onboarding.subtitle')}</p>
			<form onSubmit={form.handleSubmit(submit)} noValidate>
				<Controller
					control={form.control}
					name="displayName"
					render={({ field, fieldState }) => (
						<Field className="mb-5" data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="authDisplayName">{t('onboarding.displayName')}</FieldLabel>
							<Input
								{...field}
								id="authDisplayName"
								autoComplete="nickname"
								autoFocus
								maxLength={100}
								aria-invalid={fieldState.invalid}
							/>
							<FieldDescription>{t('onboarding.displayNameHint')}</FieldDescription>
							{fieldState.invalid && (
								<FieldError>{t(`${fieldState.error?.message}`)}</FieldError>
							)}
						</Field>
					)}
				/>
				<ButtonLoading className="w-full mb-3" type="submit" isLoading={form.formState.isSubmitting}>
					{t('onboarding.finish')}
				</ButtonLoading>
				<Button type="button" variant="ghost" className="w-full" onClick={onDone}>
					{t('onboarding.skip')}
				</Button>
				{error && (
					<p role="alert" className="text-destructive text-center mt-3 text-sm">
						{t(`authError.${error}`)}
					</p>
				)}
			</form>
		</>
	);
}
