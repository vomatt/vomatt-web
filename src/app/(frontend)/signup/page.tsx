import defineMetadata from '@/lib/defineMetadata';
import { sanityFetch } from '@/sanity/lib/live';
import { pSignUpDataQuery } from '@/sanity/lib/queries';

import SignUp from './_component/SignUp';

export async function generateMetadata() {
	const { data } = await sanityFetch({
		query: pSignUpDataQuery,
		stega: false,
	});
	return defineMetadata({ data });
}

export default async function Page() {
	const { data: signUpInfoData } = await sanityFetch({
		query: pSignUpDataQuery,
		perspective: 'published',
		stega: false,
	});

	return <SignUp signUpInfoData={signUpInfoData} />;
}
