import defineMetadata from '@/lib/defineMetadata';
import { sanityFetch } from '@/sanity/lib/live';
import { gSignUpDataQuery } from '@/sanity/lib/queries';
import SignUp from './_component/SignUp';

export async function generateMetadata() {
	const { data } = await sanityFetch({
		query: gSignUpDataQuery,
		stega: false,
	});
	return defineMetadata({ data });
}

export default async function Page() {
	const { data: signUpInfoData } = await sanityFetch({
		query: gSignUpDataQuery,
		perspective: 'published',
		stega: false,
	});

	return <SignUp signUpInfoData={signUpInfoData} />;
}
