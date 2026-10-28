'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AuthErrorKey } from '@/lib/api/auth-errors';
import { getPasskeyLoginOptions, verifyPasskeyLogin } from '@/lib/api/services/auth';

import { useSupportsPasskeys } from './support';

/** The user closed the browser's passkey sheet, it timed out, or the request was aborted: nothing to report. */
const CANCELLED = ['NotAllowedError', 'AbortError'];

type PasskeyLoginButtonProps = {
	onSignedIn: () => void;
	/** Called with null when a new attempt starts. */
	onError: (error: AuthErrorKey | null) => void;
};

/**
 * Signs in with a passkey from this button, or, while it is mounted, from the
 * autofill menu of an input with `autoComplete="username webauthn"`.
 */
export function PasskeyLoginButton({ onSignedIn, onError }: PasskeyLoginButtonProps) {
	const { t } = useLanguage();
	const isSupported = useSupportsPasskeys();
	const [isSigningIn, setIsSigningIn] = useState(false);
	const autofill = useRef<AbortController | null>(null);

	/** The autofill request stays quiet until a passkey is picked: it starts on page load, unasked. */
	async function signIn(mediation?: CredentialMediationRequirement, signal?: AbortSignal) {
		const quiet = mediation === 'conditional';
		try {
			const options = await getPasskeyLoginOptions();
			if (options.status === 'ERROR') {
				if (!quiet) onError(options.error);
				return;
			}
			const credential = await navigator.credentials.get({
				publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(options.options),
				mediation,
				signal,
			});
			if (!credential) return;
			const result = await verifyPasskeyLogin((credential as PublicKeyCredential).toJSON());
			if (result.status === 'ERROR') onError(result.error);
			else onSignedIn();
		} catch (error) {
			const name = (error as { name?: string } | null)?.name ?? '';
			if (!quiet && !CANCELLED.includes(name)) onError('serverError');
		}
	}

	const startAutofill = useEffectEvent((signal: AbortSignal) => signIn('conditional', signal));

	useEffect(() => {
		const controller = new AbortController();
		autofill.current = controller;
		(async () => {
			const available =
				typeof window.PublicKeyCredential?.parseRequestOptionsFromJSON === 'function' &&
				(await window.PublicKeyCredential.isConditionalMediationAvailable?.());
			if (available && !controller.signal.aborted) await startAutofill(controller.signal);
		})();
		return () => controller.abort();
	}, []);

	// ponytail: autofill isn't restarted after the button or a failed verify; restart it if users miss it
	const signInWithButton = async () => {
		// A page may run one WebAuthn request at a time
		autofill.current?.abort();
		onError(null);
		setIsSigningIn(true);
		try {
			await signIn();
		} finally {
			setIsSigningIn(false);
		}
	};

	if (!isSupported) return null;
	return (
		<Button type="button" variant="outline" className="mt-2 w-full" loading={isSigningIn} onClick={signInWithButton}>
			{t('auth.continueWithPasskey')}
		</Button>
	);
}
