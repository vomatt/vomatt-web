import { useCallback, useState } from 'react';

import type { AuthErrorKey } from '@/lib/api/auth-errors';
import { requestOtp, verifyOtp } from '@/lib/api/services/auth';
import { updateProfile } from '@/lib/api/services/users';

/** email → code → (new accounts only) profile. */
type AuthStep = 'email' | 'code' | 'profile';

export type AuthResult = { status: 'OK' } | { status: 'ERROR'; error: AuthErrorKey };

const OK: AuthResult = { status: 'OK' };
const SERVER_ERROR: AuthResult = { status: 'ERROR', error: 'serverError' };

/**
 * One flow for sign-in and sign-up: the backend signs in an existing email
 * and creates an account for a new one with the same one-time code.
 */
export function useAuthFlow() {
	const [step, setStep] = useState<AuthStep>('email');
	const [email, setEmail] = useState('');

	const submitEmail = useCallback(async (value: string): Promise<AuthResult> => {
		try {
			const res = await requestOtp(value);
			if (res.status === 'ERROR') return res;
			setEmail(value.trim());
			setStep('code');
			return OK;
		} catch {
			return SERVER_ERROR;
		}
	}, []);

	const resendCode = useCallback(async (): Promise<AuthResult> => {
		try {
			const res = await requestOtp(email);
			return res.status === 'ERROR' ? res : OK;
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
		submitEmail,
		resendCode,
		submitCode,
		submitProfile,
		editEmail,
	};
}
