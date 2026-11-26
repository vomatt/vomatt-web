import { useCallback, useState } from 'react';

import { trackEvent } from '@/lib/analytics';
import type { AuthErrorKey } from '@/lib/api/auth-errors';
import { requestOtp, verifyOtp } from '@/lib/api/services/auth';
import { getMyProfile, updateProfile } from '@/lib/api/services/users';

import { forgetCodeSent, recallCodeSent, rememberCodeSent } from './codeSent';

/** email → code → profile (new accounts, and ones that never gave a first name). */
type AuthStep = 'email' | 'code' | 'profile';

export type AuthResult = { status: 'OK' } | { status: 'ERROR'; error: AuthErrorKey };
/** `COOLDOWN`: no code was sent, as one went out recently; a resend is allowed in `seconds`. */
export type ResendResult = AuthResult | { status: 'COOLDOWN'; seconds: number };

export const OK: AuthResult = { status: 'OK' };
export const SERVER_ERROR: AuthResult = { status: 'ERROR', error: 'serverError' };

/**
 * One flow for sign-in and sign-up: the backend signs in an existing email
 * and creates an account for a new one with the same one-time code.
 * `surface` is where it runs, for the sign-in events.
 */
export function useAuthFlow(surface: 'dialog' | 'page') {
	// The dialog opens only on the client, after a tap, so it can start at the code step a reload interrupted.
	// The login page renders on the server too, and always starts at the email step
	const [resumed] = useState(() => (surface === 'dialog' ? recallCodeSent() : null));
	const [step, setStep] = useState<AuthStep>(resumed ? 'code' : 'email');
	const [email, setEmail] = useState(resumed?.email ?? '');
	/** Seconds until a resend, when the code step opened during the cooldown of an earlier code. */
	const [resendIn, setResendIn] = useState<number | undefined>(resumed?.resendIn);
	/** A new account's username, which everyone else sees it by until it sets a display name. */
	const [username, setUsername] = useState<string>();

	const submitEmail = useCallback(async (value: string): Promise<AuthResult> => {
		try {
			const res = await requestOtp(value);
			if (res.status === 'ERROR') return res;
			if (res.status === 'SUCCESS') trackEvent('sign_in_code_sent', { surface });
			// A code sent within the cooldown (after a reload, or a quick sign-out) is usually still valid: both last 180 s
			const cooldown = res.status === 'COOLDOWN' ? res.seconds : undefined;
			setResendIn(cooldown);
			setEmail(value.trim());
			// Only the dialog resumes after a reload
			if (surface === 'dialog') rememberCodeSent(value.trim(), cooldown);
			setStep('code');
			return OK;
		} catch {
			return SERVER_ERROR;
		}
	}, [surface]);

	const resendCode = useCallback(async (): Promise<ResendResult> => {
		try {
			const res = await requestOtp(email);
			if (res.status !== 'SUCCESS') return res;
			if (surface === 'dialog') rememberCodeSent(email);
			return OK;
		} catch {
			return SERVER_ERROR;
		}
	}, [email, surface]);

	/** Resolves `done: true` when the user is signed in and nothing else is asked. */
	const submitCode = useCallback(
		async (code: string): Promise<AuthResult & { done?: boolean }> => {
			try {
				const res = await verifyOtp(email, code);
				if (res.status === 'ERROR') return res;
				forgetCodeSent();
				trackEvent('sign_in_completed', { surface, method: 'email', newAccount: res.isNewUser });
				if (res.isNewUser) {
					setUsername(res.username);
					setStep('profile');
					return OK;
				}
				// Someone who left at the name step is asked again; a failed check doesn't hold up sign-in
				const me = await getMyProfile().catch(() => null);
				if (me && !me.firstName?.trim()) {
					setUsername(me.username);
					setStep('profile');
					return OK;
				}
				return { status: 'OK', done: true };
			} catch {
				return SERVER_ERROR;
			}
		},
		[email, surface]
	);

	/** Saves a new account's real name. The account already exists, so failure isn't fatal. */
	const submitProfile = useCallback(async (name: { firstName: string; lastName: string }): Promise<AuthResult> => {
		const lastName = name.lastName.trim();
		try {
			// A blank last name is left out: sending it empty would clear it
			await updateProfile({ firstName: name.firstName.trim(), ...(lastName && { lastName }) });
			return OK;
		} catch {
			return SERVER_ERROR;
		}
	}, []);

	const editEmail = useCallback(() => {
		forgetCodeSent();
		setStep('email');
	}, []);

	return {
		/** Opened at the code step a reload interrupted, rather than starting a sign-in. */
		resumed: !!resumed,
		step,
		email,
		resendIn,
		username,
		submitEmail,
		resendCode,
		submitCode,
		submitProfile,
		editEmail,
	};
}
