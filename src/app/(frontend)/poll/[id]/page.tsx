import { formatDistance } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ArrowLeft, Share2, Users } from '@/components/ui/SvgIcons';
import Link from 'next/link';

import { ApiError, publicFetch } from '@/lib/api/client';
import { PollCard } from '@/app/(frontend)/_components/PollCard';
import { Button } from '@/components/ui/Button';
import { Poll } from '@/types/poll';

async function getPoll(id: string): Promise<Poll | null> {
	try {
		return await publicFetch<Poll>(
			`${process.env.API_URL}/api/v1/votes/${id}`,
			{ next: { revalidate: 30 } } as RequestInit
		);
	} catch (error) {
		if (error instanceof ApiError && error.statusCode === 404) return null;
		throw error;
	}
}

export default async function PollDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const poll = await getPoll(id);

	if (!poll) {
		return (
			<div className="px-contain max-w-2xl mx-auto py-10">
				<Link href="/">
					<Button variant="ghost" size="sm" className="mb-6">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back
					</Button>
				</Link>
				<p className="text-muted-foreground">Poll not found.</p>
			</div>
		);
	}

	return (
		<div className="px-contain max-w-2xl mx-auto py-6">
			<div className="flex items-center justify-between mb-6">
				<Link href="/">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back
					</Button>
				</Link>
				<Button
					variant="outline"
					size="sm"
					onClick={undefined}
					className="gap-2"
					aria-label="Share poll"
				>
					<Share2 className="w-4 h-4" />
					Share
				</Button>
			</div>

			<PollCard pollData={poll} />

			<div className="mt-6 p-4 rounded-xl border border-border bg-card text-sm text-muted-foreground space-y-1">
				<div className="flex items-center gap-2">
					<Users className="w-4 h-4" />
					<span>{poll.totalVotes} total votes</span>
				</div>
				<div>
					Created by{' '}
					<Link
						href={`/profile/${poll.creatorUsername}`}
						className="text-foreground hover:underline font-medium"
					>
						{poll.creatorUsername}
					</Link>{' '}
					·{' '}
					{formatDistance(new Date(poll.createdAt), new Date(), {
						locale: enUS,
					})}{' '}
					ago
				</div>
				{poll.endTime && (
					<div>
						{new Date(poll.endTime) > new Date()
							? `Ends ${formatDistance(new Date(poll.endTime), new Date(), { locale: enUS, addSuffix: true })}`
							: `Ended ${formatDistance(new Date(poll.endTime), new Date(), { locale: enUS, addSuffix: true })}`}
					</div>
				)}
			</div>
		</div>
	);
}
