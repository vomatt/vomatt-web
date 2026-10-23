'use server';

import { z } from 'zod';

import type { ActionResult } from '@/lib/api/action';
import { attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';

import { FEEDBACK_MESSAGE_MAX } from './schema';

// A Server Action is a public endpoint: check what callers send, not just what the dialog allows
const Message = z.string().trim().min(1).max(FEEDBACK_MESSAGE_MAX);

/**
 * Sends a problem report as product feedback (`POST /api/feedback`, sign-in required).
 * Over the daily limit it fails with 429 `common.rate_limited`.
 */
export async function reportProblem(message: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient('/feedback', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: Message.parse(message) }),
		});
	});
}
