import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import { cn } from '@/lib/utils';

/** The first card starts where it will land: below the pill bar, or for guests where the login prompt goes. Level with HomeRail's. */
export function FeedSkeleton({ signedIn = true }: { signedIn?: boolean }) {
	return (
		<div
			className={cn(
				'w-full max-w-feed pb-4',
				signedIn ? 'pt-[calc(var(--feed-bar-height)+0.5rem)]' : 'pt-6'
			)}
		>
			<PollListSkeleton />
		</div>
	);
}
