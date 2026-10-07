import { formatDistance } from 'date-fns';
import { enUS } from 'date-fns/locale';
import Link from 'next/link';

import { LoginPrompt } from '@/components/LoginPrompt';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Share2, Users } from '@/components/ui/SvgIcons';
import { getUserSession } from '@/data/auth';
import { PollCard } from '@/features/polls/components/PollCard';
import type { Poll } from '@/features/polls/schema';
import { getPollForViewer } from '@/features/polls/service';
import { getTurnout } from '@/features/polls/status';
import { ApiError } from '@/lib/api/client';

export default async function PollDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const user = await getUserSession();
	let poll: Poll | null;
	try {
		poll = await getPollForViewer(id);
	} catch (error) {
		// The API serves single Polls to signed-in users only
		if (error instanceof ApiError && error.statusCode === 401) {
			return (
				<div className="px-contain max-w-2xl mx-auto py-10">
					<LoginPrompt className="block mx-auto max-w-sm" redirectTo={`/poll/${id}`} />
				</div>
			);
		}
		throw error;
	}

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

			<PollCard poll={poll} viewerId={user?.sub} />

			<div className="mt-6 p-4 rounded-xl border border-border bg-card text-sm text-muted-foreground space-y-1">
				<div className="flex items-center gap-2">
					<Users className="w-4 h-4" />
					<span>{getTurnout(poll) ?? 0} total votes</span>
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
