import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache, Suspense } from 'react';

import { BackLink } from '@/components/BackLink';
import { JsonLd } from '@/components/JsonLd';
import { PageShell } from '@/components/layout/PageShell';
import { LoginPrompt } from '@/components/LoginPrompt';
import { T } from '@/components/T';
import { Skeleton } from '@/components/ui/Skeleton';
import { getMyProfile, getUserSession } from '@/data/auth';
import { MarkNotificationRead } from '@/features/notifications/MarkNotificationRead';
import { InvitationPrompt } from '@/features/polls/components/InvitationPrompt';
import { MoreFromAuthor } from '@/features/polls/components/MoreFromAuthor';
import { PollAbout } from '@/features/polls/components/PollAbout';
import { PollCardSkeleton } from '@/features/polls/components/PollCardSkeleton';
import type { Poll } from '@/features/polls/schema';
import { getInviteOnlyCreator, getPoll, getUserPolls } from '@/features/polls/service';
import { shareDescription } from '@/features/polls/sharePreview';
import { derivePollStatus, isCancelled, isInvitee, isPublic } from '@/features/polls/status';
import { AuthError } from '@/lib/api/client';
import { pollHref } from '@/lib/routes';
import { pollJsonLd } from '@/lib/structuredData';

import { switchAccount } from './actions';
import { PollDiscussion } from './PollDiscussion';

type Lookup =
	| { poll: Poll }
	| { poll: null; reason: 'session-rejected' }
	| { poll: null; reason: 'invite-only'; creator: { username: string; avatarUrl: string | null } };

// The API only serves UUID poll ids; signed out, it answers any other id with 401
const POLL_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Metadata and the page share one lookup per request
const lookupPoll = cache(async (id: string): Promise<Lookup> => {
	if (!POLL_ID.test(id)) notFound();
	let poll: Poll | null;
	try {
		poll = await getPoll(id);
	} catch (error) {
		// Polls are public; a 401 means the API refused this viewer's token
		if (error instanceof AuthError) return { poll: null, reason: 'session-rejected' };
		throw error;
	}
	if (poll) return { poll };
	// A 404 may be an Invite-only Poll this viewer can't open yet (e.g. from an
	// invitation email); the creator lookup 404s for every other Poll
	const creator = await getInviteOnlyCreator(id);
	if (!creator) notFound();
	return { poll: null, reason: 'invite-only', creator };
});

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	const { poll } = await lookupPoll(id);
	if (!poll) return { title: 'Vomatt', robots: { index: false } };

	const description = shareDescription(poll);
	return {
		title: poll.title,
		description,
		openGraph: { title: poll.title, description, type: 'article' },
		twitter: { card: 'summary_large_image', title: poll.title, description },
		alternates: { canonical: pollHref(poll.id) },
		// Unlisted and invite-only polls are meant only for people with the link
		...(!isPublic(poll) && { robots: { index: false } }),
	};
}

export default async function PollDetailPage({ params }: Props) {
	const { id } = await params;
	return (
		<PageShell
			rail={
				<Suspense fallback={<PollRailSkeleton />}>
					<PollRail id={id} />
				</Suspense>
			}
		>
			<div className="flex flex-col gap-8">
				<BackLink href="/">
					<T k="common.back" />
				</BackLink>
				<Suspense fallback={<PollCardSkeleton options={4} />}>
					<PollDetail id={id} />
				</Suspense>
			</div>
		</PageShell>
	);
}

async function PollDetail({ id }: { id: string }) {
	const [lookup, user, profile] = await Promise.all([lookupPoll(id), getUserSession(), getMyProfile()]);

	if (!lookup.poll) {
		return lookup.reason === 'invite-only' ? (
			<InvitationPrompt
				creator={lookup.creator}
				pollId={id}
				switchAccount={user ? switchAccount.bind(null, id) : undefined}
			/>
		) : (
			<LoginPrompt className="mx-auto w-full max-w-[520px]" redirectTo={`/poll/${id}`} forPoll sessionExpired />
		);
	}

	const { poll } = lookup;
	const ended = derivePollStatus(poll) === 'ended';
	// An Invitee has an Invitation until the Poll Ends; then the owner, Participants
	// and Invitees get the Ended Notification (not for a Cancelled Poll)
	const invited = !!user && isInvitee(poll, user.sub);
	const hasNotification =
		!!user &&
		(ended ? !isCancelled(poll) && (poll.creatorId === user.sub || invited || !!poll.myOptionId) : invited);

	return (
		<div className="flex flex-col gap-6">
			<JsonLd data={pollJsonLd(poll)} />
			{hasNotification && <MarkNotificationRead pollId={poll.id} />}
			<PollDiscussion
				poll={poll}
				anonymousByDefault={profile?.anonymousBallotByDefault}
				pollId={poll.id}
				commentCount={poll.commentCount}
				viewerId={user?.sub}
				viewer={profile ? { username: profile.username, avatarUrl: profile.avatarUrl } : undefined}
			/>
		</div>
	);
}

/** Shares PollDetail's cached lookup; empty when the poll doesn't open. */
async function PollRail({ id }: { id: string }) {
	const { poll } = await lookupPoll(id);
	if (!poll) return null;
	return (
		// pt-13 is the BackLink's line plus gap-8, so the rail starts level with the poll card
		<aside className="flex flex-col gap-4 xl:sticky xl:top-8 xl:pt-13">
			<PollAbout poll={poll} />
			{derivePollStatus(poll) !== 'ended' && (
				<Suspense fallback={null}>
					<MoreFrom username={poll.creatorUsername} pollId={poll.id} />
				</Suspense>
			)}
		</aside>
	);
}

/** Two of the author's other Polls; left out when there are none or the list fails. */
async function MoreFrom({ username, pollId }: { username: string; pollId: string }) {
	const page = await getUserPolls(username, null, 3).catch(() => null);
	const polls = (page?.items ?? []).filter((poll) => poll.id !== pollId).slice(0, 2);
	return polls.length > 0 && <MoreFromAuthor username={username} polls={polls} />;
}

function PollRailSkeleton() {
	return (
		<div className="space-y-4 rounded-2xl border border-border bg-card p-5 xl:mt-13">
			<Skeleton className="h-3.5 w-28" />
			<Skeleton className="h-3.5 w-full" />
			<Skeleton className="h-3.5 w-5/6" />
		</div>
	);
}
