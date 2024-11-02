import SignIn from '@/components/auth/SignIn';
import { getUserSession } from '@/lib/auth';
import defineMetadata from '@/lib/defineMetadata';
import { getPageHomeData } from '@/sanity/lib/fetch';

export async function generateMetadata({}) {
	const data = await getPageHomeData();
	return defineMetadata({ data });
}

export default async function Page() {
	const userSession = await getUserSession();
	console.log('🚀 ~ file: page.tsx:13 ~ Page ~ userSession:', userSession);

	if (!userSession) {
		return <SignIn />;
	}
	return <div className="p-home">Home</div>;
}
