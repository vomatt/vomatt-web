'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AuthErrorKey } from '@/lib/api/auth-errors';
import { getPasskeyLoginOptions, verifyPasskeyLogin } from '@/lib/api/services/auth';

import { useSupportsPasskeys } from './support';

/** The user closed the browser's passkey sheet, it timed out, or the request was aborted: nothing to report. */
const CANCELLED = ['NotAllowedError', 'AbortError'];

/** The API's challenges last 5 minutes; older options are fetched again before use. */
const OPTIONS_MAX_AGE_MS = 4 * 60 * 1000;
const OPTIONS_REFRESH_MS = 30 * 1000;

type LoginOptions = Awaited<ReturnType<typeof getPasskeyLoginOptions>>;

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
	const autofill = useRef<{ controller: AbortController; done: Promise<void> } | null>(null);
	// Fetched before the click: Safari only shows the passkey sheet while the click's user activation lasts
	const options = useRef<{ result: Promise<LoginOptions>; fetchedAt: number } | null>(null);
	const isSignedIn = useRef(false);

	/** Kept only once fetched: a failed fetch is tried again by the next caller. */
	function loginOptions() {
		const cached = options.current;
		if (cached && Date.now() - cached.fetchedAt < OPTIONS_MAX_AGE_MS) return cached.result;
		const entry = { result: getPasskeyLoginOptions(), fetchedAt: Date.now() };
		options.current = entry;
		const forget = () => {
			if (options.current === entry) options.current = null;
		};
		entry.result.then((result) => result.status === 'ERROR' && forget(), forget);
		return entry.result;
	}

	/** The autofill request stays quiet until a passkey is picked: it starts on page load, unasked. */
	async function signIn(mediation?: CredentialMediationRequirement, signal?: AbortSignal) {
		const quiet = mediation === 'conditional';
		try {
			const result = await loginOptions();
			if (result.status === 'ERROR') {
				if (!quiet) onError(result.error);
				return;
			}
			const credential = await navigator.credentials.get({
				publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(result.options),
				mediation,
				signal,
			});
			if (!credential) return;
			// Verifying spends the challenge
			options.current = null;
			const verified = await verifyPasskeyLogin((credential as PublicKeyCredential).toJSON());
			if (verified.status === 'ERROR') {
				onError(verified.error);
				return;
			}
			isSignedIn.current = true;
			onSignedIn();
		} catch (error) {
			const name = (error as { name?: string } | null)?.name ?? '';
			if (quiet || CANCELLED.includes(name)) return;
			console.error('Passkey sign-in failed:', error);
			onError('serverError');
		}
	}

	const prepare = useEffectEvent(async (signal: AbortSignal) => {
		loginOptions();
		const available = await window.PublicKeyCredential.isConditionalMediationAvailable?.();
		if (available && !signal.aborted) await signIn('conditional', signal);
	});

	const refreshOptions = useEffectEvent(() => {
		loginOptions();
	});

	useEffect(() => {
		if (typeof window.PublicKeyCredential?.parseRequestOptionsFromJSON !== 'function') return;
		const controller = new AbortController();
		const done = prepare(controller.signal).catch((error) => console.error('Passkey autofill failed to start:', error));
		autofill.current = { controller, done };
		// Replaces options before they expire, so a late click still finds them ready
		const refresh = setInterval(refreshOptions, OPTIONS_REFRESH_MS);
		return () => {
			controller.abort();
			clearInterval(refresh);
		};
	}, []);

	// ponytail: autofill isn't restarted after the button or a failed verify; restart it if users miss it
	const signInWithButton = async () => {
		onError(null);
		setIsSigningIn(true);
		try {
			// A page may run one WebAuthn request at a time, and Safari fails a new one while the aborted one is still open
			autofill.current?.controller.abort();
			await autofill.current?.done;
			// A passkey picked from autofill may have signed in meanwhile
			if (!isSignedIn.current) await signIn();
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
