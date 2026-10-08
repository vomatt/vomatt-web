import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getMyProfile } from '@/data/auth';
import { ballotHistory, computeInsights } from '@/features/account/insights';
import { getMyPolls, getParticipatedPolls } from '@/features/polls/service';

import AccountPage from './_components/AccountPage';

export const metadata: Metadata = { title: 'Your account' };

export default async function Page() {
	const [profile, myPolls, participated] = await Promise.all([
		getMyProfile(),
		getMyPolls().catch(() => []),
		getParticipatedPolls().catch(() => []),
	]);
	if (!profile) redirect('/login?redirect=/account');
	const history = ballotHistory(participated);
	const insights = computeInsights(profile, myPolls, history);

	return <AccountPage profile={profile} myPolls={myPolls} history={history} insights={insights} />;
}
