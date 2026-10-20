'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AuthErrorKey } from '@/lib/api/auth-errors';

import { AuthError } from './AuthError';
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from './InputOTP';
import type { AuthResult } from './useAuthFlow';

/** Matches the backend's default OTP resend cooldown. */
export const RESEND_COOLDOWN_SECONDS = 180;
const CODE_LENGTH = 6;

interface VerificationFormProps {
	email: string;
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
	email,
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

	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
		return () => clearTimeout(timer);
	}, [cooldown]);

	async function submit(value: string) {
		if (value.length !== CODE_LENGTH || isLoading) return;
		setError(null);
		setIsLoading(true);
		try {
			const res = await onSubmitCode(value);
			if (res.status === 'ERROR') {
				setError(res.error);
				setCode('');
			}
		} finally {
			setIsLoading(false);
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
		<div className="flex flex-col">
			<h1 className="mb-3 display-heading text-[30px]">{t('verificationCode.title')}</h1>
			<p className="mb-8 text-base leading-relaxed text-muted-foreground">
				{t('verificationCode.subtitle')}{' '}
				{/* Own line, so a long address wraps whole instead of splitting mid-word */}
				<strong className="block font-medium text-foreground wrap-anywhere">{email}</strong>
			</p>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					submit(code);
				}}
				className="w-full mb-4"
			>
				<Field className="mb-6">
					<InputOTP
						maxLength={CODE_LENGTH}
						autoFocus
						value={code}
						onChange={(value) => {
							setCode(value.replace(/\D/g, ''));
							if (error) setError(null);
						}}
						onComplete={submit}
						inputMode="numeric"
						autoComplete="one-time-code"
						disabled={isLoading}
						aria-label={t('verificationCode.inputLabel')}
						containerClassName="w-full"
					>
						<InputOTPGroup>
							{[0, 1, 2].map((index) => (
								<InputOTPSlot key={index} index={index} invalid={!!error} />
							))}
						</InputOTPGroup>
						<InputOTPSeparator className="text-muted-foreground" />
						<InputOTPGroup>
							{[3, 4, 5].map((index) => (
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
			<div className="flex flex-wrap items-center justify-between gap-x-4">
				{cooldown > 0 ? (
					<p className="flex h-11 items-center text-sm text-muted-foreground tabular-nums">
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
			</div>
			{resent && (
				<p className="text-sm text-positive" role="status">
					{t('verificationCode.codeSent')}
				</p>
			)}
		</div>
	);
}
