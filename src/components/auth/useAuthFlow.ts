import { useCallback, useState } from 'react';

import {
	getVerifyCode,
	login,
	preSignup,
	signup,
} from '@/lib/api/services/auth';
import type { SignupFormData } from './auth-schemas';

type AuthMode = 'login' | 'signup';
type AuthStep = 'form' | 'verification';

export function useAuthFlow() {
	const [mode, setMode] = useState<AuthMode>('login');
	const [step, setStep] = useState<AuthStep>('form');
	const [email, setEmail] = useState('');
	const [signupData, setSignupData] = useState<SignupFormData | null>(null);

	const submitLoginEmail = useCallback(async (emailValue: string) => {
		const res = await getVerifyCode(emailValue);

		if (res.status === 'SUCCESS') {
			setEmail(emailValue);
			setStep('verification');
			return { status: 'SUCCESS' as const };
		}

		return {
			status: 'ERROR' as const,
			errorType: res.errorType,
		};
	}, []);

	const submitSignupForm = useCallback(async (data: SignupFormData) => {
		const res = await preSignup(data.email, data.username);

		if (res.status === 'SUCCESS') {
			setEmail(data.email);
			setSignupData(data);
			setStep('verification');
			return { status: 'SUCCESS' as const };
		}

		return {
			status: 'ERROR' as const,
			message: res.message,
		};
	}, []);

	const handleLoginVerified = useCallback(
		async (pin: string) => {
			try {
				const result = await login(email, pin);
				if (result.status === 'SUCCESS') return { status: 'OK' as const };
				return {
					status: 'ERROR' as const,
					message: result.message || 'Login failed',
				};
			} catch {
				return {
					status: 'ERROR' as const,
					message: 'Something went wrong, please try again later',
				};
			}
		},
		[email]
	);

	const handleSignupVerified = useCallback(
		async (pin: string) => {
			if (!signupData) {
				return { status: 'ERROR' as const, message: 'Missing signup data' };
			}
			try {
				const result = await signup({
					...signupData,
					verificationCode: pin,
				});

				if (result.status === 'SUCCESS') return { status: 'OK' as const };
				return {
					status: 'ERROR' as const,
					message: result.errorType || 'Signup failed',
				};
			} catch {
				return {
					status: 'ERROR' as const,
					message: 'Something went wrong, please try again later',
				};
			}
		},
		[signupData]
	);

	const switchToSignup = useCallback(() => {
		setMode('signup');
		setStep('form');
	}, []);

	const switchToLogin = useCallback(() => {
		setMode('login');
		setStep('form');
	}, []);

	const goBackToForm = useCallback(() => {
		setStep('form');
	}, []);

	const reset = useCallback(() => {
		setMode('login');
		setStep('form');
		setEmail('');
		setSignupData(null);
	}, []);

	return {
		mode,
		step,
		email,
		signupData,
		submitLoginEmail,
		submitSignupForm,
		handleLoginVerified,
		handleSignupVerified,
		switchToSignup,
		switchToLogin,
		goBackToForm,
		reset,
	};
}
