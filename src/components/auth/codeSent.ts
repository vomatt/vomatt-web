import { RESEND_COOLDOWN_SECONDS } from './VerificationForm';

/**
 * The address a sign-in code just went to, kept in session storage so the dialog can reopen at the code step
 * after a reload: a phone may drop the tab while the person is in their mail app.
 */
const STORAGE_KEY = 'vomatt_sign_in_code';
/** Matches a held vote's window; a code that has expired by then can be resent from the code step. */
const REMEMBER_MS = 15 * 60_000;

type CodeSent = { email: string; sentAt: number };

/** `resendIn`: seconds left of the cooldown when no new code went out (the API answered COOLDOWN). */
export function rememberCodeSent(email: string, resendIn?: number) {
	const elapsed = resendIn === undefined ? 0 : (RESEND_COOLDOWN_SECONDS - resendIn) * 1000;
	const sent: CodeSent = { email, sentAt: Date.now() - elapsed };
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sent));
	} catch {
		// Without storage a reload starts from the email step, as before
	}
}

/** The address and the seconds left before a resend, or null when no recent code is remembered. */
export function recallCodeSent(): { email: string; resendIn: number } | null {
	try {
		const sent: Partial<CodeSent> = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null') ?? {};
		if (typeof sent.email !== 'string' || typeof sent.sentAt !== 'number') return null;
		const elapsed = Date.now() - sent.sentAt;
		if (elapsed > REMEMBER_MS) return null;
		return { email: sent.email, resendIn: Math.max(0, RESEND_COOLDOWN_SECONDS - Math.floor(elapsed / 1000)) };
	} catch {
		return null;
	}
}

export function forgetCodeSent() {
	try {
		sessionStorage.removeItem(STORAGE_KEY);
	} catch {
		// Nothing was stored
	}
}
