'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AuthErrorKey } from '@/lib/api/auth-errors';

import { AuthError } from './AuthError';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './InputOTP';
import type { AuthResult } from './useAuthFlow';

/** Matches the backend's default OTP resend cooldown. */
export const RESEND_COOLDOWN_SECONDS = 180;
const CODE_LENGTH = 6;

interface VerificationFormProps {
	onSubmitCode: (code: string) => Promise<AuthResult>;
	onResend: () => Promise<AuthResult>;
	onEditEmail: () => void;
}

function formatCountdown(seconds: number) {
	const m = Math.floor(seconds / 60);
	const s = String(seconds % 60).padStart(2, '0');
	return `${m}:${s}`;
}

export default function VerificationForm({
	onSubmitCode,
	onResend,
	onEditEmail,
}: VerificationFormProps) {
	const { t } = useLanguage();
	const [code, setCode] = useState('');
	const [error, setError] = useState<AuthErrorKey | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [resent, setResent] = useState(false);
	const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
	const inputRef = useRef<HTMLInputElement>(null);
	// The input is disabled while a code is checked, so it loses focus; a wrong code brings it back
	const refocusAfterCheck = useRef(false);
	const checking = useRef(false);

	useEffect(() => {
		if (isLoading || !refocusAfterCheck.current) return;
		refocusAfterCheck.current = false;
		const input = inputRef.current;
		input?.focus();
		input?.setSelectionRange(0, input.value.length);
	}, [isLoading]);

	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
		return () => clearTimeout(timer);
	}, [cooldown]);

	async function submit(value: string) {
		// A ref, not isLoading: Enter can land before the auto-submit re-renders, and the backend spends a code on its first check
		if (value.length !== CODE_LENGTH || checking.current) return;
		checking.current = true;
		setError(null);
		setIsLoading(true);
		let signedIn = false;
		try {
			const res = await onSubmitCode(value);
			if (res.status === 'ERROR') {
				setError(res.error);
				refocusAfterCheck.current = true;
			} else {
				signedIn = true;
			}
		} finally {
			// Once signed in the form stays locked until the page moves on: the spent code would only come back expired
			if (!signedIn) {
				checking.current = false;
				setIsLoading(false);
			}
		}
	}

	async function resend() {
		setError(null);
		setResent(false);
		setIsResending(true);
		try {
			const res = await onResend();
			if (res.status === 'ERROR') {
				setError(res.error);
				return;
			}
			setResent(true);
			setCode('');
			setCooldown(RESEND_COOLDOWN_SECONDS);
		} finally {
			setIsResending(false);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<form
				onSubmit={(event) => {
					event.preventDefault();
					submit(code);
				}}
				className="w-full"
			>
				<Field className="mb-6">
					<InputOTP
						ref={inputRef}
						maxLength={CODE_LENGTH}
						autoFocus
						value={code}
						onChange={(value) => {
							setCode(value.replace(/\D/g, ''));
							if (error) setError(null);
						}}
						// A wrong code stays in the slots, selected, so typing the right one replaces it
						onFocus={(event) => {
							if (error) event.currentTarget.setSelectionRange(0, event.currentTarget.value.length);
						}}
						onComplete={submit}
						inputMode="numeric"
						autoComplete="one-time-code"
						disabled={isLoading}
						aria-label={t('verificationCode.inputLabel')}
						containerClassName="w-full"
					>
						<InputOTPGroup>
							{Array.from({ length: CODE_LENGTH }, (_, index) => (
								<InputOTPSlot key={index} index={index} invalid={!!error} />
							))}
						</InputOTPGroup>
					</InputOTP>
					<AuthError error={error} />
				</Field>
				<Button
					type="submit"
					className="w-full"
					loading={isLoading}
					disabled={code.length !== CODE_LENGTH}
				>
					{t('common.continue')}
				</Button>
			</form>

			{/* The countdown isn't live (it would be read out every second); this says once when resend opens up */}
			<p className="sr-only" aria-live="polite">
				{cooldown > 0 ? '' : t('verificationCode.resendReady')}
			</p>
			{/* Both ways out of a missing code sit together, quieter than Continue */}
			<div className="flex flex-col items-start gap-2.5">
				{cooldown > 0 ? (
					<p className="text-body-4 text-muted-foreground tabular-nums">
						{t('verificationCode.resendIn', { time: formatCountdown(cooldown) })}
					</p>
				) : (
					<Button variant="link" loading={isResending} onClick={resend}>
						{t('verificationCode.resendVerificationCode')}
					</Button>
				)}
				{/* Locked while a code is checked, or a late success would sign in the old address */}
				<Button type="button" variant="link" disabled={isLoading} onClick={onEditEmail}>
					{t('verificationCode.useAnotherEmail')}
				</Button>
				{resent && (
					<p className="text-caption-1 text-positive" role="status">
						{t('verificationCode.codeSent')}
					</p>
				)}
			</div>
		</div>
	);
}
