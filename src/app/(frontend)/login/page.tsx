import defineMetadata from '@/lib/defineMetadata';
import { getServerMessages } from '@/lib/getServerLocale';
import { sanityFetch } from '@/sanity/lib/live';
import { pSignUpDataQuery } from '@/sanity/lib/queries';

import { LogIn } from './_component/LogIn';

export async function generateMetadata() {
	const { messages } = await getServerMessages();
	return defineMetadata({ data: { title: messages.login.title } });
}

export default async function Page() {
	const { data } = await sanityFetch({ query: pSignUpDataQuery });

	return <LogIn policyMessage={data?.policyMessage} />;
}
