import Auth from '@/app/_components/auth';
import { getUserSession } from '@/lib/auth';
import defineMetadata from '@/lib/defineMetadata';
import { getPageHomeData, getSignUpInfoData } from '@/sanity/lib/fetch';

export async function generateMetadata({}) {
	const data = await getPageHomeData();
	return defineMetadata({ data });
}

export default async function Page() {
	const userSession = await getUserSession();
	const signUpInfoData = await getSignUpInfoData();

	if (!userSession) {
		return <Auth signUpInfoData={signUpInfoData} />;
	}
	return <div className="p-home">Home</div>;
}
