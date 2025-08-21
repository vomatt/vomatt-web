import defineMetadata from '@/lib/defineMetadata';

import SignIn from './_component/SignIn';

export async function generateMetadata() {
	return defineMetadata({ data: { title: 'Login Vomatt' } });
}

export default async function Page() {
	return <SignIn />;
}
