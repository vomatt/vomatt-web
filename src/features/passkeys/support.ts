import { useHydrated } from '@/hooks/useHydrated';

/**
 * Whether this browser can create and use passkeys with the WebAuthn JSON
 * helpers. False on the server and during hydration.
 */
export function useSupportsPasskeys() {
	const isHydrated = useHydrated();
	return (
		isHydrated &&
		typeof window.PublicKeyCredential?.parseCreationOptionsFromJSON === 'function' &&
		typeof navigator.credentials?.create === 'function'
	);
}
