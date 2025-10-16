import { getUserSession } from '@/data/auth';
import defineMetadata from '@/lib/defineMetadata';

import AccountPage from './_components/AccountPage';
export async function generateMetadata({}) {
	return defineMetadata({ data: {} });
}

export default async function Page() {
	const user = await getUserSession();
	return <AccountPage userData={user} />;
}
