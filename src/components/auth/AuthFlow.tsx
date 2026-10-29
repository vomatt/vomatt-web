'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { PortableTextBlock } from '@portabletext/react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import CustomPortableText from '@/components/CustomPortableText';
import { Button } from '@/components/ui/Button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Field, FieldLabel, FieldMessage } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';
import { PasskeyLoginButton } from '@/features/passkeys/PasskeyLoginButton';
import type { AuthErrorKey } from '@/lib/api/auth-errors';
import { cn } from '@/lib/utils';

import {
	type EmailFormData,
	emailSchema,
	type ProfileFormData,
	profileSchema,
} from './auth-schemas';
import { AuthError } from './AuthError';
import { type AuthResult, useAuthFlow } from './useAuthFlow';
import VerificationForm from './VerificationForm';

type AuthFlowProps = {
	/** Called once the user is signed in (and, for a new account, past the profile step). */
	onDone: () => void;
	/** Called when a new account is signed in and the profile step opens, before `onDone`. */
	onSignedIn?: () => void;
	/** The terms a new account agrees to, shown under the email step. */
	policyMessage?: PortableTextBlock[] | null;
	/** Each step's title becomes the dialog's title instead of the page's h1. */
	inDialog?: boolean;
};

export function AuthFlow({ onDone, onSignedIn, policyMessage, inDialog = false }: AuthFlowProps) {
	const { t } = useLanguage();
	const flow = useAuthFlow();

	let heading: { title: string; subtitle: React.ReactNode };
	let body: React.ReactNode;
	if (flow.step === 'code') {
		heading = {
			title: t('verificationCode.title'),
			subtitle: (
				<>
					{t('verificationCode.subtitle')}{' '}
					<strong className="font-medium text-foreground wrap-anywhere">{flow.email}</strong>
				</>
			),
		};
		body = (
			<VerificationForm
				onSubmitCode={async (code) => {
					const res = await flow.submitCode(code);
					if (res.status === 'OK') {
						if (res.done) onDone();
						else onSignedIn?.();
					}
					return res;
				}}
				onResend={flow.resendCode}
				onEditEmail={flow.editEmail}
			/>
		);
	} else if (flow.step === 'profile') {
		heading = { title: t('onboarding.title'), subtitle: t('onboarding.subtitle') };
		body = <ProfileStep onSave={flow.submitProfile} onDone={onDone} />;
	} else {
		heading = {
			title: t('login.title'),
			subtitle: t(inDialog ? 'login.dialogDescription' : 'login.subtitle'),
		};
		body = (
			<>
				<EmailStep
					defaultEmail={flow.email}
					onSubmit={flow.submitEmail}
					// The login page only: a dialog over another page shouldn't claim its autofill
					onPasskeySignIn={inDialog ? undefined : onDone}
				/>
				{policyMessage && (
					<div className="text-[12px] text-muted-foreground">
						<CustomPortableText blocks={policyMessage} />
					</div>
				)}
			</>
		);
	}

	return (
		<div className={cn('flex flex-col', inDialog ? 'gap-5' : 'gap-6')}>
			{inDialog ? (
				// Clear of the close button in the corner
				<DialogHeader className="gap-1.5 pr-8">
					<DialogTitle>{heading.title}</DialogTitle>
					<DialogDescription className="text-[14px]">{heading.subtitle}</DialogDescription>
				</DialogHeader>
			) : (
				<div className="flex flex-col gap-2">
					<h1 className="text-[30px] font-medium leading-[1.2] tracking-[-0.02em]">{heading.title}</h1>
					<p className="text-base leading-relaxed text-muted-foreground">{heading.subtitle}</p>
				</div>
			)}
			{body}
		</div>
	);
}

function EmailStep({
	defaultEmail,
	onSubmit,
	onPasskeySignIn,
}: {
	defaultEmail: string;
	onSubmit: (email: string) => Promise<AuthResult>;
	/** Offers passkey sign-in, by button and from the email field's autofill. */
	onPasskeySignIn?: () => void;
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
		<form onSubmit={form.handleSubmit(submit)} noValidate>
			<Controller
				control={form.control}
				name="email"
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor="authEmail">{t('common.email')}</FieldLabel>
						<Input
							{...field}
							type="email"
							id="authEmail"
							autoComplete={onPasskeySignIn ? 'username webauthn' : 'email'}
							autoFocus
							aria-invalid={fieldState.invalid}
							aria-describedby={fieldState.invalid ? 'authEmail-error' : undefined}
							placeholder="you@example.com"
						/>
						{/* A line stays reserved for the error, so it appears without moving the button */}
						<FieldMessage
							className="-mt-1.5 text-sm"
							errors={
								fieldState.error?.message
									? [{ id: 'authEmail-error', text: t(fieldState.error.message) }]
									: []
							}
						/>
					</Field>
				)}
			/>
			<Button className="w-full" type="submit" loading={form.formState.isSubmitting}>
				{t('auth.continueWithEmail')}
			</Button>
			{onPasskeySignIn && <PasskeyLoginButton onSignedIn={onPasskeySignIn} onError={setError} />}
			<AuthError error={error} className="mt-3" />
		</form>
	);
}

function ProfileStep({
	onSave,
	onDone,
}: {
	onSave: (name: ProfileFormData) => Promise<AuthResult>;
	onDone: () => void;
}) {
	const { t } = useLanguage();
	const form = useForm<ProfileFormData>({
		resolver: zodResolver(profileSchema),
		defaultValues: { firstName: '', lastName: '' },
	});

	async function submit(name: ProfileFormData) {
		const res = await onSave(name);
		// The account is already signed in, so a failed save mustn't hold the person here
		if (res.status === 'ERROR') toast.error(t('onboarding.saveFailed'));
		onDone();
	}

	const nameField = (name: keyof ProfileFormData, id: string, label: string, autoComplete: string, autoFocus = false) => (
		<Controller
			control={form.control}
			name={name}
			render={({ field, fieldState }) => (
				<Field data-invalid={fieldState.invalid}>
					<FieldLabel htmlFor={id}>{label}</FieldLabel>
					<Input
						{...field}
						id={id}
						autoComplete={autoComplete}
						autoFocus={autoFocus}
						maxLength={50}
						aria-invalid={fieldState.invalid}
						aria-describedby={fieldState.invalid ? `${id}-error` : undefined}
					/>
					<FieldMessage
						errors={fieldState.error?.message ? [{ id: `${id}-error`, text: t(fieldState.error.message) }] : []}
					/>
				</Field>
			)}
		/>
	);

	return (
		<form onSubmit={form.handleSubmit(submit)} noValidate>
			<div className="mb-4 grid gap-3 sm:grid-cols-2">
				{nameField('firstName', 'authFirstName', t('profile.firstName'), 'given-name', true)}
				{nameField('lastName', 'authLastName', t('profile.lastName'), 'family-name')}
			</div>
			<Button className="w-full" type="submit" loading={form.formState.isSubmitting}>
				{t('onboarding.finish')}
			</Button>
		</form>
	);
}
