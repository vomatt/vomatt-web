import { track } from '@vercel/analytics';

import type { Audience } from '@/features/polls/schema';

type SignInSurface = 'dialog' | 'page';

/**
 * Every product event and its props. Props say what happened, never who or to which poll:
 * no user ids, emails, usernames, poll ids or titles.
 */
type ProductEvents = {
	/** The email step is shown. */
	sign_in_started: { surface: SignInSurface };
	sign_in_code_sent: { surface: SignInSurface };
	sign_in_completed: { surface: SignInSurface; method: 'email' | 'passkey'; newAccount: boolean };
	/** A ballot is saved; `change` when it replaced the voter's earlier one. */
	vote_cast: { change: boolean };
	/** `QR` when the QR dialog opens. */
	poll_shared: { channel: 'NATIVE' | 'COPY_LINK' | 'LINE' | 'QR' };
	poll_created: { audience: Audience };
	upgrade_clicked: Record<string, never>;
};

/** Records a product event in Vercel Analytics. Browser only; call it once the thing has happened. */
export function trackEvent<Name extends keyof ProductEvents>(name: Name, props: ProductEvents[Name]) {
	track(name, props);
}
