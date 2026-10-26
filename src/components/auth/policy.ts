'use server';

import type { PortableTextBlock } from '@portabletext/react';

import { sanityFetch } from '@/sanity/lib/live';
import { pSignUpDataQuery } from '@/sanity/lib/queries';

/** The sign-up terms for the auth dialog, which opens in Client Components that can't fetch Sanity on the server. */
export async function getPolicyMessage(): Promise<PortableTextBlock[] | null> {
	const { data } = await sanityFetch({ query: pSignUpDataQuery });
	return data?.policyMessage ?? null;
}
