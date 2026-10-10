import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getMyProfile } from '@/data/auth';
import { ballotHistory, computeInsights } from '@/features/account/insights';
import { getMyPolls } from '@/features/polls/service';
import { EMPTY_PAGE } from '@/lib/api/cursor';

import AccountPage from './_components/AccountPage';

export const metadata: Metadata = { title: 'Your account' };

export default async function Page() {
	// The latest 50 of each: Polls the user created or holds a Ballot in
	const [profile, open, ended] = await Promise.all([
		getMyProfile(),
		getMyPolls('open').catch(() => EMPTY_PAGE),
		getMyPolls('ended').catch(() => EMPTY_PAGE),
	]);
	if (!profile) redirect('/login?redirect=/account');
	const polls = [...open.items, ...ended.items];
	const myPolls = polls.filter((poll) => poll.creatorId === profile.id);
	const history = ballotHistory(polls);
	const insights = computeInsights(profile, myPolls, history);

	return <AccountPage profile={profile} myPolls={myPolls} history={history} insights={insights} />;
}
