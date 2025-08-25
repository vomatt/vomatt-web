import defineMetadata from '@/lib/defineMetadata';

import LogIn from './_component/LogIn';

export function generateMetadata() {
	return defineMetadata({ data: { title: 'Login Vomatt' } });
}

export default async function Page() {
	return <LogIn />;
}
