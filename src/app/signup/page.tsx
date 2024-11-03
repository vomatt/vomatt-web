import { getUserSession } from '@/lib/auth';
import defineMetadata from '@/lib/defineMetadata';
import { getPageHomeData, getSignUpInfoData } from '@/sanity/lib/fetch';

import SignUp from './_component/SignUp';

export async function generateMetadata({}) {
	const data = await getPageHomeData();
	return defineMetadata({ data });
}

export default async function Page() {
	const signUpInfoData = await getSignUpInfoData();

	return <SignUp signUpInfoData={signUpInfoData} />;
}
