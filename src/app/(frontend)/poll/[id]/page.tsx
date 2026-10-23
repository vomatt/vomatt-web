import type { Metadata } from 'next';
import Link from 'next/link';
import { cache, Suspense } from 'react';

import { LoginPrompt } from '@/components/LoginPrompt';
import { T } from '@/components/T';
import { buttonVariants } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowLeft } from '@/components/ui/SvgIcons';
import { getMyProfile, getUserSession } from '@/data/auth';
import { MarkNotificationRead } from '@/features/notifications/MarkNotificationRead';
import { InvitationPrompt } from '@/features/polls/components/InvitationPrompt';
import { PollAbout } from '@/features/polls/components/PollAbout';
import { PollCard } from '@/features/polls/components/PollCard';
import { PollCardSkeleton } from '@/features/polls/components/PollCardSkeleton';
import type { Poll } from '@/features/polls/schema';
import { getInviteOnlyCreator, getPoll } from '@/features/polls/service';
import { derivePollStatus, isCancelled, isInvitee } from '@/features/polls/status';
import { AuthError } from '@/lib/api/client';

type Lookup =
	| { poll: Poll }
	| { poll: null; reason: 'not-found' | 'session-rejected' };

// Metadata and the page share one lookup per request
const lookupPoll = cache(async (id: string): Promise<Lookup> => {
	try {
		const poll = await getPoll(id);
		return poll ? { poll } : { poll: null, reason: 'not-found' };
	} catch (error) {
		// Polls are public; a 401 means the API refused this viewer's token
		if (error instanceof AuthError) return { poll: null, reason: 'session-rejected' };
		throw error;
	}
});

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	const { poll } = await lookupPoll(id);
	if (!poll) return { title: 'Vomatt' };

	const description =
		poll.description || poll.options.map((option) => option.text).join(' / ');
	return {
		title: poll.title,
		description,
		openGraph: { title: poll.title, description, type: 'article' },
		twitter: { card: 'summary', title: poll.title, description },
	};
}

function BackLink() {
	return (
		<Link
			href="/"
			className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'mb-4' })}
		>
			<ArrowLeft className="mr-2 size-4" />
			Back
		</Link>
	);
}

export default async function PollDetailPage({ params }: Props) {
	const { id } = await params;
	return (
		<div className="px-contain mx-auto max-w-5xl py-6">
			<BackLink />
			<Suspense fallback={<PollDetailSkeleton />}>
				<PollDetail id={id} />
			</Suspense>
		</div>
	);
}

async function PollDetail({ id }: { id: string }) {
	const [lookup, user, profile] = await Promise.all([lookupPoll(id), getUserSession(), getMyProfile()]);

	if (!lookup.poll) {
		// A 404 may be an Invite-only Poll this viewer can't open yet (e.g. from an invitation email)
		const creator = lookup.reason === 'not-found' ? await getInviteOnlyCreator(id) : null;
		if (creator) return <InvitationPrompt creator={creator} pollId={id} signedIn={!!user} />;
		return lookup.reason !== 'not-found' || !user ? (
			<LoginPrompt
				className="block mx-auto max-w-sm"
				redirectTo={`/poll/${id}`}
				sessionExpired={lookup.reason === 'session-rejected'}
			/>
		) : (
			<p className="text-muted-foreground">
				<T k="pollDetail.notFound" />
			</p>
		);
	}

	const { poll } = lookup;
	// An Invitee has an Invitation until the Poll Ends; then the owner, Participants
	// and Invitees get the Ended Notification (not for a Cancelled Poll)
	const invited = !!user && isInvitee(poll, user.sub);
	const hasNotification =
		!!user &&
		(derivePollStatus(poll) === 'ended'
			? !isCancelled(poll) && (poll.creatorId === user.sub || invited || !!poll.myOptionId)
			: invited);

	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
			{hasNotification && <MarkNotificationRead pollId={poll.id} />}
			<PollCard
				poll={lookup.poll}
				viewerId={user?.sub}
				anonymousByDefault={profile?.anonymousBallotByDefault}
				defaultShowComments
				deletedHref="/my-polls"
				headingLevel="h1"
			/>
			<div className="lg:sticky lg:top-6">
				<PollAbout poll={lookup.poll} />
			</div>
		</div>
	);
}

function PollDetailSkeleton() {
	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
			<PollCardSkeleton options={4} />
			<div className="space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6">
				<div className="flex items-center gap-3">
					<Skeleton className="size-9 rounded-full" />
					<Skeleton className="h-4 w-24" />
				</div>
				<Skeleton className="h-3.5 w-full" />
				<Skeleton className="h-3.5 w-5/6" />
			</div>
		</div>
	);
}
