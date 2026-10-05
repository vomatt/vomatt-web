import { redirect } from 'next/navigation';

import { getMyProfile, getUserSession } from '@/data/auth';
import defineMetadata from '@/lib/defineMetadata';
import { getPollsByCreator } from '@/features/polls/service';

import AccountPage from './_components/AccountPage';

export async function generateMetadata({}) {
	return defineMetadata({ data: {} });
}

export default async function Page() {
	const [session, profile] = await Promise.all([
		getUserSession(),
		getMyProfile(),
	]);
	if (!session || !profile) redirect('/login');

	const polls = await getPollsByCreator(profile.username);

	return <AccountPage profile={profile} polls={polls} />;
}
