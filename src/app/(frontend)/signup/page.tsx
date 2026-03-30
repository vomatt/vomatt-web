import type { Metadata } from 'next';
import { getPayload } from 'payload';

import config from '@payload-config';
import { getServerLocale } from '@/lib/getServerLocale';

import SignUp from './_component/SignUp';

async function getSignUpPageData(payloadLocale: string) {
	const payload = await getPayload({ config });
	return payload.findGlobal({
		slug: 'sign-up-page',
		locale: payloadLocale as 'en' | 'zh-TW',
	});
}

export async function generateMetadata(): Promise<Metadata> {
	const { payloadLocale } = await getServerLocale();
	const data = await getSignUpPageData(payloadLocale);
	const meta = data.meta as { metaTitle?: string | null; metaDescription?: string | null } | null | undefined;

	return {
		title: meta?.metaTitle ?? data.title ?? 'Sign Up',
		description: meta?.metaDescription ?? '',
	};
}

export default async function Page() {
	const { payloadLocale } = await getServerLocale();
	const signUpPageData = await getSignUpPageData(payloadLocale);
	return <SignUp signUpInfoData={signUpPageData} />;
}
