import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getMyProfile } from '@/data/auth';
import { ballotHistory, computeInsights } from '@/features/account/insights';
import { getFeed, getMyPolls } from '@/features/polls/service';

import AccountPage from './_components/AccountPage';

export const metadata: Metadata = { title: 'Your account' };

export default async function Page() {
	const profile = await getMyProfile();
	if (!profile) redirect('/login?redirect=/account');

	// The API can't list the polls a user voted in yet, so look through the newest ones
	const [myPolls, recent] = await Promise.all([
		getMyPolls().catch(() => []),
		getFeed(null, 50).catch(() => null),
	]);
	const history = ballotHistory(recent?.items ?? []);
	const insights = computeInsights(profile, myPolls, history);

	return <AccountPage profile={profile} myPolls={myPolls} history={history} insights={insights} />;
}
