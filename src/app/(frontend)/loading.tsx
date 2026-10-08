import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';

export default function Loading() {
	return (
		<div className="px-contain flex justify-center gap-8 py-0">
			<div className="w-full max-w-[560px] py-4">
				<PollListSkeleton />
			</div>
		</div>
	);
}
