import { redirect } from 'next/navigation';

import { getMyProfile, getUserSession } from '@/data/auth';
import defineMetadata from '@/lib/defineMetadata';
import { getPollsByCreator } from '@/lib/api/services/polls';

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

	return <AccountPage profile={{ ...profile, totalPolls: polls.length }} polls={polls} />;
}
