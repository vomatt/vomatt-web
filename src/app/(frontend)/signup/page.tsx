import type { Metadata } from 'next';
import { getPayload } from 'payload';

import config from '@payload-config';

import SignUp from './_component/SignUp';

export async function generateMetadata(): Promise<Metadata> {
	const payload = await getPayload({ config });
	const data = await payload.findGlobal({ slug: 'sign-up-page' });

	const meta = data.meta as { metaTitle?: string | null; metaDescription?: string | null } | null | undefined;

	return {
		title: meta?.metaTitle ?? data.title ?? 'Sign Up',
		description: meta?.metaDescription ?? '',
	};
}

export default async function Page() {
	const payload = await getPayload({ config });
	const signUpPageData = await payload.findGlobal({ slug: 'sign-up-page' });

	return <SignUp signUpInfoData={signUpPageData} />;
}
