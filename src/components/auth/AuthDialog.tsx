'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { ButtonLoading } from '@/components/ButtonLoading';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/Dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';

import {
	loginSchema,
	signupSchema,
	type LoginFormData,
	type SignupFormData,
} from './auth-schemas';
import { useAuthFlow } from './useAuthFlow';
import VerificationForm from './VerificationForm';

// --- Types ---

interface AuthDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAuthSuccess: () => void;
}

// --- Main Component ---

export function AuthDialog({ open, onOpenChange, onAuthSuccess }: AuthDialogProps) {
	const { t } = useLanguage();
	const flow = useAuthFlow();

	// Reset state when dialog closes
	useEffect(() => {
		if (!open) {
			flow.reset();
		}
	}, [open]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{flow.step === 'verification'
							? ''
							: flow.mode === 'login'
								? t('login.title')
								: t('signup.title')}
					</DialogTitle>
					<DialogDescription className="sr-only">
						{flow.mode === 'login'
							? t('login.dialogDescription')
							: t('signup.dialogDescription')}
					</DialogDescription>
				</DialogHeader>

				{flow.step === 'verification' ? (
					<VerificationForm
						email={flow.email}
						submitCodeFunc={
							flow.mode === 'login'
								? flow.handleLoginVerified
								: flow.handleSignupVerified
						}
						backButtonFunc={flow.goBackToForm}
						onSuccess={onAuthSuccess}
					/>
				) : flow.mode === 'login' ? (
					<DialogLoginForm
						onVerificationNeeded={flow.submitLoginEmail}
						onSwitchToSignup={flow.switchToSignup}
					/>
				) : (
					<DialogSignupForm
						onVerificationNeeded={flow.submitSignupForm}
						onSwitchToLogin={flow.switchToLogin}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

// --- Login Form ---

function DialogLoginForm({
	onVerificationNeeded,
	onSwitchToSignup,
}: {
	onVerificationNeeded: (email: string) => Promise<{ status: string; errorType?: string }>;
	onSwitchToSignup: () => void;
}) {
	const { t } = useLanguage();
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

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
				onSwitchToSignup();
				return;
			}

			setError(res.errorType || 'Something went wrong');
		} catch {
			setError('Something went wrong');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<Controller
					control={form.control}
					name="email"
					render={({ field, fieldState }) => (
						<Field className="mb-5">
							<FieldLabel htmlFor="authDialogEmail">
								{t('common.email')}
							</FieldLabel>
							<Input
								{...field}
								type="text"
								id="authDialogEmail"
								aria-invalid={fieldState.invalid}
								placeholder="m@example.com"
							/>
							{fieldState.invalid && (
								<FieldError>
									{t(`${fieldState.error?.message}`)}
								</FieldError>
							)}
						</Field>
					)}
				/>
				<ButtonLoading
					className="w-full"
					type="submit"
					isLoading={isLoading}
				>
					{t('common.login')}
				</ButtonLoading>
				{error && (
					<p className="text-destructive text-center mt-3 text-sm">
						{error}
					</p>
				)}
			</form>

			<p className="mt-5 text-center text-sm">
				{t('login.footNote')}&nbsp;
				<button
					type="button"
					onClick={onSwitchToSignup}
					className="underline underline-offset-4 hover:text-foreground transition-colors"
				>
					{t('common.signUp')}
				</button>
			</p>
		</div>
	);
}

// --- Signup Form ---

function DialogSignupForm({
	onVerificationNeeded,
	onSwitchToLogin,
}: {
	onVerificationNeeded: (data: SignupFormData) => Promise<{ status: string; message?: string }>;
	onSwitchToLogin: () => void;
}) {
	const { t } = useLanguage();
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<SignupFormData>({
		resolver: zodResolver(signupSchema),
		defaultValues: { email: '', firstName: '', lastName: '', username: '' },
	});

	async function onSubmit(data: SignupFormData) {
		setIsLoading(true);
		setError('');

		try {
			const res = await onVerificationNeeded(data);

			if (res.status === 'SUCCESS') return;

			setError(res.message || 'Something went wrong');
		} catch {
			setError('Something went wrong');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<Controller
					control={form.control}
					name="email"
					render={({ field, fieldState }) => (
						<Field>
							<FieldLabel htmlFor="authDialogSignupEmail">
								{t('common.email')}
							</FieldLabel>
							<Input
								{...field}
								type="text"
								id="authDialogSignupEmail"
								aria-invalid={fieldState.invalid}
								placeholder="m@example.com"
							/>
							{fieldState.invalid && (
								<FieldError>{t(`${fieldState.error?.message}`)}</FieldError>
							)}
						</Field>
					)}
				/>
				<Controller
					control={form.control}
					name="firstName"
					render={({ field, fieldState }) => (
						<Field>
							<FieldLabel htmlFor="authDialogFirstName">
								{t('common.firstName')}
							</FieldLabel>
							<Input
								{...field}
								type="text"
								id="authDialogFirstName"
								aria-invalid={fieldState.invalid}
								autoComplete="off"
							/>
							{fieldState.invalid && (
								<FieldError>{t(`${fieldState.error?.message}`)}</FieldError>
							)}
						</Field>
					)}
				/>
				<Controller
					control={form.control}
					name="lastName"
					render={({ field, fieldState }) => (
						<Field>
							<FieldLabel htmlFor="authDialogLastName">
								{t('common.lastName')}
							</FieldLabel>
							<Input
								{...field}
								type="text"
								id="authDialogLastName"
								aria-invalid={fieldState.invalid}
								autoComplete="off"
							/>
							{fieldState.invalid && (
								<FieldError>{t(`${fieldState.error?.message}`)}</FieldError>
							)}
						</Field>
					)}
				/>
				<Controller
					control={form.control}
					name="username"
					render={({ field, fieldState }) => (
						<Field>
							<FieldLabel htmlFor="authDialogUsername">
								{t('common.username')}
							</FieldLabel>
							<Input
								{...field}
								type="text"
								id="authDialogUsername"
								aria-invalid={fieldState.invalid}
								autoComplete="off"
							/>
							{fieldState.invalid && (
								<FieldError>{t(`${fieldState.error?.message}`)}</FieldError>
							)}
						</Field>
					)}
				/>
				<ButtonLoading
					className="w-full"
					type="submit"
					isLoading={isLoading}
				>
					{t('signup.submit')}
				</ButtonLoading>
				{error && (
					<p className="text-destructive text-center mt-3 text-sm">
						{error}
					</p>
				)}
			</form>

			<p className="mt-5 text-center text-sm">
				{t('signup.alreadyHaveAccount')}&nbsp;
				<button
					type="button"
					onClick={onSwitchToLogin}
					className="underline underline-offset-4 hover:text-foreground transition-colors"
				>
					{t('common.login')}
				</button>
			</p>
		</div>
	);
}
