'use server';

import { z } from 'zod';

import type { ActionResult } from '@/lib/api/action';
import { attempt } from '@/lib/api/action';
import { apiClient, AuthError, publicFetch } from '@/lib/api/client';

import { FEEDBACK_MESSAGE_MAX } from './schema';

// A Server Action is a public endpoint: check what callers send, not just what the dialog allows
const Message = z.string().trim().min(1).max(FEEDBACK_MESSAGE_MAX);

/**
 * Sends a problem report. Signed-out visitors can report too.
 * Assumed contract (not in api-docs.json yet): `POST /api/feedback` with `{ message }`.
 */
export async function reportProblem(message: string): Promise<ActionResult> {
	return attempt(async () => {
		const request = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: Message.parse(message) }),
		};
		try {
			await apiClient('/feedback', { ...request, auth: 'optional' });
		} catch (error) {
			// A rejected session shouldn't stop a report anyone may send: send it signed out
			if (!(error instanceof AuthError)) throw error;
			await publicFetch('/feedback', request);
		}
	});
}
