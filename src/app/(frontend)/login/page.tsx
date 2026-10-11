import defineMetadata from '@/lib/defineMetadata';
import { sanityFetch } from '@/sanity/lib/live';
import { pSignUpDataQuery } from '@/sanity/lib/queries';

import { LogIn } from './_component/LogIn';

export function generateMetadata() {
	return defineMetadata({ data: { title: 'Login Vomatt' } });
}

export default async function Page() {
	const { data } = await sanityFetch({ query: pSignUpDataQuery });

	return <LogIn policyMessage={data?.policyMessage} />;
}
