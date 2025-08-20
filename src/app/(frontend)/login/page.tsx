import defineMetadata from '@/lib/defineMetadata';

import SignIn from './_component/SignIn';

export async function generateMetadata() {
	return defineMetadata({ title: 'Login Vomatt' });
}

export default async function Page() {
	return <SignIn />;
}
