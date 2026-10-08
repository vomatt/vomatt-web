'use client';

import { useEffect, useState } from 'react';

import { ButtonLoading } from '@/components/ButtonLoading';
import { MailCheckIcon } from '@/components/ui/animate-icon/MailCheck';
import { Button } from '@/components/ui/Button';
import { Field, FieldError } from '@/components/ui/Field';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AuthErrorKey } from '@/lib/api/auth-errors';

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
		<div className="text-center flex flex-col items-center">
			<MailCheckIcon className="size-16 md:size-20 mb-3" />
			<h1 className="text-3xl mb-3">{t('verificationCode.title')}</h1>
			<p className="mb-8 text-sm text-muted-foreground">
				{t('verificationCode.subtitle')} <strong className="text-foreground">{email}</strong>
			</p>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					submit(code);
				}}
				className="w-full mb-8"
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
						containerClassName="justify-center"
					>
						<InputOTPGroup>
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} />
						</InputOTPGroup>
						<InputOTPSeparator />
						<InputOTPGroup>
							<InputOTPSlot index={3} />
							<InputOTPSlot index={4} />
							<InputOTPSlot index={5} />
						</InputOTPGroup>
					</InputOTP>
					{error && (
						<FieldError role="alert" className="text-center text-destructive">
							{t(`authError.${error}`)}
						</FieldError>
					)}
				</Field>
				<ButtonLoading
					type="submit"
					className="w-full mb-3"
					isLoading={isLoading}
					disabled={code.length !== CODE_LENGTH}
				>
					{t('common.continue')}
				</ButtonLoading>
				<Button type="button" className="w-full" onClick={onEditEmail} variant="outline">
					{t('verificationCode.useAnotherEmail')}
				</Button>
			</form>

			{cooldown > 0 ? (
				<p className="text-sm text-muted-foreground" aria-live="polite">
					{t('verificationCode.resendIn', { time: formatCountdown(cooldown) })}
				</p>
			) : (
				<ButtonLoading
					className="underline mx-auto block"
					variant="link"
					isLoading={isResending}
					disabled={isResending}
					onClick={resend}
				>
					{t('verificationCode.resendVerificationCode')}
				</ButtonLoading>
			)}
			{resent && (
				<p className="text-sm mt-2 text-center text-positive" role="status">
					{t('verificationCode.codeSent')}
				</p>
			)}
		</div>
	);
}
