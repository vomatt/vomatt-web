'use server';

import { z } from 'zod';

import { type ActionResult, attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';

const CheckoutSchema = z.object({ url: z.string() });

/**
 * The payment page to send the user to. The plan is the person's, so never sent as a community account.
 * 503 `billing.unavailable` until paid plans launch.
 */
export async function startCheckout(): Promise<ActionResult<string>> {
	return attempt(async () => CheckoutSchema.parse(await apiClient('/billing/checkout', { method: 'POST', actAs: false })).url);
}
