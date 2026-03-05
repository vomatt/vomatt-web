import type { Metadata } from 'next';
import { getPayload } from 'payload';
import { cache } from 'react';

import config from '@payload-config';

import SignUp from './_component/SignUp';

const getSignUpPageData = cache(async () => {
	const payload = await getPayload({ config });
	return payload.findGlobal({ slug: 'sign-up-page' });
});

export async function generateMetadata(): Promise<Metadata> {
	const data = await getSignUpPageData();
	const meta = data.meta as { metaTitle?: string | null; metaDescription?: string | null } | null | undefined;

	return {
		title: meta?.metaTitle ?? data.title ?? 'Sign Up',
		description: meta?.metaDescription ?? '',
	};
}

export default async function Page() {
	const signUpPageData = await getSignUpPageData();
	return <SignUp signUpInfoData={signUpPageData} />;
}
