import { useCallback, useState } from 'react';

import type { AuthErrorKey } from '@/lib/api/auth-errors';
import { requestOtp, verifyOtp } from '@/lib/api/services/auth';
import { getMyProfile, updateProfile } from '@/lib/api/services/users';

/** email → code → profile (new accounts, and ones that never gave a first name). */
type AuthStep = 'email' | 'code' | 'profile';

export type AuthResult = { status: 'OK' } | { status: 'ERROR'; error: AuthErrorKey };
/** `COOLDOWN`: no code was sent, as one went out recently; a resend is allowed in `seconds`. */
export type ResendResult = AuthResult | { status: 'COOLDOWN'; seconds: number };

const OK: AuthResult = { status: 'OK' };
const SERVER_ERROR: AuthResult = { status: 'ERROR', error: 'serverError' };

/**
 * One flow for sign-in and sign-up: the backend signs in an existing email
 * and creates an account for a new one with the same one-time code.
 */
export function useAuthFlow() {
	const [step, setStep] = useState<AuthStep>('email');
	const [email, setEmail] = useState('');
	/** Seconds until a resend, when the code step opened during the cooldown of an earlier code. */
	const [resendIn, setResendIn] = useState<number>();
	/** A new account's username, which everyone else sees it by until it sets a display name. */
	const [username, setUsername] = useState<string>();

	const submitEmail = useCallback(async (value: string): Promise<AuthResult> => {
		try {
			const res = await requestOtp(value);
			if (res.status === 'ERROR') return res;
			// A code sent within the cooldown (after a reload, or a quick sign-out) is usually still valid: both last 180 s
			setResendIn(res.status === 'COOLDOWN' ? res.seconds : undefined);
			setEmail(value.trim());
			setStep('code');
			return OK;
		} catch {
			return SERVER_ERROR;
		}
	}, []);

	const resendCode = useCallback(async (): Promise<ResendResult> => {
		try {
			const res = await requestOtp(email);
			return res.status === 'SUCCESS' ? OK : res;
		} catch {
			return SERVER_ERROR;
		}
	}, [email]);

	/** Resolves `done: true` when the user is signed in and nothing else is asked. */
	const submitCode = useCallback(
		async (code: string): Promise<AuthResult & { done?: boolean }> => {
			try {
				const res = await verifyOtp(email, code);
				if (res.status === 'ERROR') return res;
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
		[email]
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

	const editEmail = useCallback(() => setStep('email'), []);

	return {
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
