import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';

import { LoginPrompt } from '@/components/LoginPrompt';
import { buttonVariants } from '@/components/ui/Button';
import { ArrowLeft } from '@/components/ui/SvgIcons';
import { getUserSession } from '@/data/auth';
import { PollAbout } from '@/features/polls/components/PollAbout';
import { PollCard } from '@/features/polls/components/PollCard';
import type { Poll } from '@/features/polls/schema';
import { getPoll } from '@/features/polls/service';
import { ApiError, AuthError } from '@/lib/api/client';

type Lookup =
	| { poll: Poll }
	| { poll: null; reason: 'not-found' | 'sign-in' | 'session-rejected' };

// Metadata and the page share one lookup per request
const lookupPoll = cache(async (id: string): Promise<Lookup> => {
	try {
		const poll = await getPoll(id);
		return poll ? { poll } : { poll: null, reason: 'not-found' };
	} catch (error) {
		// The API serves single Polls to signed-in users only
		if (error instanceof ApiError && error.statusCode === 401) {
			return { poll: null, reason: 'sign-in' };
		}
		// Signed in here, but the API refused the token
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
		poll.description || poll.options.map((option) => option.text).join(' · ');
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
	const [lookup, user] = await Promise.all([lookupPoll(id), getUserSession()]);

	if (!lookup.poll) {
		return (
			<div className="px-contain max-w-2xl mx-auto py-10">
				<BackLink />
				{lookup.reason !== 'not-found' ? (
					<LoginPrompt
						className="block mx-auto max-w-sm"
						redirectTo={`/poll/${id}`}
						sessionExpired={lookup.reason === 'session-rejected'}
					/>
				) : (
					<p className="text-muted-foreground">Poll not found.</p>
				)}
			</div>
		);
	}

	return (
		<div className="px-contain mx-auto max-w-5xl py-6">
			<BackLink />
			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
				<PollCard poll={lookup.poll} viewerId={user?.sub} defaultShowComments />
				<div className="lg:sticky lg:top-6">
					<PollAbout poll={lookup.poll} />
				</div>
			</div>
		</div>
	);
}
