'use client';

import { useState } from 'react';

import { AuthError } from '@/components/auth/AuthError';
import type { AuthResult, ResendResult } from '@/components/auth/useAuthFlow';
import VerificationForm from '@/components/auth/VerificationForm';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ActionFailure } from '@/lib/api/action';
import { type AuthErrorKey, cooldownSeconds, toAuthErrorKey } from '@/lib/api/auth-errors';
import { sendPhoneBindOtp, verifyPhoneBind } from '@/lib/api/services/users';
import type { MyProfile } from '@/types/user';

const OK: AuthResult = { status: 'OK' };
const SERVER_ERROR: AuthResult = { status: 'ERROR', error: 'serverError' };

/** Bind refusals worded for a phone; the rest read as at sign-in. */
const PHONE_ERRORS: Record<string, AuthErrorKey> = {
	'auth.invalid_otp': 'invalidSmsCode',
	'auth.sms.send_failed': 'smsSendFailed',
	'user.phone.taken': 'phoneTaken',
	// Another account bound the number between send and verify
	'common.conflict': 'phoneTaken',
};

function toResult(failure: ActionFailure): ResendResult {
	const seconds = cooldownSeconds(failure.errorCode, failure.message);
	if (seconds) return { status: 'COOLDOWN', seconds };
	const key = (failure.errorCode && PHONE_ERRORS[failure.errorCode]) || toAuthErrorKey(failure.errorCode, failure.status);
	// The sign-in fallback for an unknown 400 asks for an email
	return { status: 'ERROR', error: key === 'invalidEmail' ? 'serverError' : key };
}

type PhoneBindDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Called with the updated profile once the number is bound; the dialog stays open until the caller closes it. */
	onVerified: (profile: MyProfile) => void;
	/** Prefills the number, e.g. a bound one that still needs verifying. */
	defaultPhone?: string | null;
};

/**
 * Adds or verifies the signed-in account's phone number: the number, then the code texted to it.
 * A wrong code is an error on the code, never a sign-out.
 */
export function PhoneBindDialog({ open, onOpenChange, onVerified, defaultPhone }: PhoneBindDialogProps) {
	const { t } = useLanguage();
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="rounded-2xl p-7 sm:max-w-[420px]" closeLabel={t('common.close')}>
				{/* Unmounted on close, so reopening starts from the number */}
				{open && <PhoneBindFlow defaultPhone={defaultPhone ?? ''} onVerified={onVerified} />}
			</DialogContent>
		</Dialog>
	);
}

function PhoneBindFlow({ defaultPhone, onVerified }: { defaultPhone: string; onVerified: (profile: MyProfile) => void }) {
	const { t } = useLanguage();
	const [step, setStep] = useState<'phone' | 'code'>('phone');
	const [phone, setPhone] = useState(defaultPhone);
	/** Seconds until a resend, when the code step opened during an earlier code's cooldown. */
	const [resendIn, setResendIn] = useState<number>();

	const send = async (value: string): Promise<ResendResult> => {
		const res = await sendPhoneBindOtp(value).catch(() => null);
		if (!res) return SERVER_ERROR;
		return res.ok ? OK : toResult(res);
	};

	const submitPhone = async (value: string): Promise<AuthResult> => {
		const res = await send(value);
		if (res.status === 'ERROR') return res;
		// An earlier code sent within the cooldown is still valid: both last 180 s
		setResendIn(res.status === 'COOLDOWN' ? res.seconds : undefined);
		setPhone(value);
		setStep('code');
		return OK;
	};

	const submitCode = async (code: string): Promise<AuthResult> => {
		const res = await verifyPhoneBind(phone, code).catch(() => null);
		if (!res) return SERVER_ERROR;
		if (!res.ok) return toResult(res) as AuthResult;
		onVerified(res.data);
		return OK;
	};

	return (
		<div className="flex flex-col gap-5">
			{/* Clear of the close button in the corner */}
			<DialogHeader className="gap-1.5 p-0 pr-8">
				<DialogTitle>{t(step === 'phone' ? 'phoneBind.title' : 'phoneBind.codeTitle')}</DialogTitle>
				<DialogDescription className="text-body-4">
					{step === 'phone' ? (
						t('phoneBind.subtitle')
					) : (
						<>
							{t('phoneBind.codeSubtitle')}{' '}
							<strong className="font-medium text-foreground wrap-anywhere">{phone}</strong>
						</>
					)}
				</DialogDescription>
			</DialogHeader>
			{step === 'phone' ? (
				<PhoneStep defaultPhone={phone} onSubmit={submitPhone} />
			) : (
				<VerificationForm
					onSubmitCode={submitCode}
					onResend={() => send(phone)}
					resendIn={resendIn}
					onEditEmail={() => setStep('phone')}
					editLabel={t('phoneBind.useAnotherNumber')}
				/>
			)}
		</div>
	);
}

function PhoneStep({ defaultPhone, onSubmit }: { defaultPhone: string; onSubmit: (phone: string) => Promise<AuthResult> }) {
	const { t } = useLanguage();
	const [value, setValue] = useState(defaultPhone);
	const [error, setError] = useState<AuthErrorKey | null>(null);
	const [isSending, setIsSending] = useState(false);

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		const phone = value.trim();
		if (!phone || isSending) return;
		setError(null);
		setIsSending(true);
		const res = await onSubmit(phone);
		// On success this step is gone
		if (res.status === 'ERROR') {
			setError(res.error);
			setIsSending(false);
		}
	}

	return (
		<form onSubmit={submit} noValidate>
			<Field data-invalid={!!error} className="mb-6">
				<FieldLabel htmlFor="bindPhone">{t('phoneBind.label')}</FieldLabel>
				<Input
					id="bindPhone"
					type="tel"
					inputMode="tel"
					autoComplete="tel"
					autoFocus
					value={value}
					onChange={(event) => {
						setValue(event.target.value);
						setError(null);
					}}
					aria-invalid={!!error}
					aria-describedby="bindPhone-hint"
					placeholder="0912345678"
				/>
				<FieldDescription id="bindPhone-hint">{t('phoneBind.hint')}</FieldDescription>
				<AuthError error={error} />
			</Field>
			<Button className="w-full" type="submit" loading={isSending} disabled={!value.trim()}>
				{t('phoneBind.sendCode')}
			</Button>
		</form>
	);
}
