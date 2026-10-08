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
	const [isNewUser, setIsNewUser] = useState(false);

	const submitEmail = useCallback(async (value: string): Promise<AuthResult> => {
		try {
			const res = await requestOtp(value);
			if (res.status === 'ERROR') return res;
			setEmail(value.trim());
			setIsNewUser(res.isNewUser);
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
				if (isNewUser) {
					setStep('profile');
					return OK;
				}
				return { status: 'OK', done: true };
			} catch {
				return SERVER_ERROR;
			}
		},
		[email, isNewUser]
	);

	/** Saves the display name for a new account. The account already exists, so failure isn't fatal. */
	const submitProfile = useCallback(async (displayName: string): Promise<AuthResult> => {
		try {
			await updateProfile({ displayName: displayName.trim() });
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
