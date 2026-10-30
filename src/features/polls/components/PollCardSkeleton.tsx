'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import { pollRowFrameClassName } from './PollListItem';
import { pollTileFrameClassName, PollTileGrid } from './PollTile';

/** Placeholder with the PollCard's shape, shown while a page's data loads. */
export function PollCardSkeleton({ options = 3 }: { options?: number }) {
	return (
		<div aria-hidden className="rounded-2xl border border-border bg-card">
			<div className="space-y-4 p-5">
				<div className="flex items-center justify-between">
					<Skeleton className="h-3.5 w-28" />
					<Skeleton className="h-5 w-20 rounded-full" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-5 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
				</div>
				<div className="space-y-1.5">
					{Array.from({ length: options }, (_, i) => (
						<Skeleton key={i} className="h-10 rounded-xl" />
					))}
				</div>
				<div className="flex items-center justify-between">
					<Skeleton className="h-3 w-24" />
					<Skeleton className="h-8 w-16" />
				</div>
			</div>
		</div>
	);
}

/**
 * Placeholder rows with PollListItem's shape: chip, title, meta line. Match the
 * list's row spacing with `className`, and drop the chip for rows without one.
 */
export function PollRowListSkeleton({ chip = true, className }: { chip?: boolean; className?: string }) {
	const { t } = useLanguage();
	return (
		<div role="status" aria-busy className={cn('space-y-2', className)}>
			<span className="sr-only">{t('common.loading')}</span>
			{Array.from({ length: 5 }, (_, i) => (
				<div key={i} aria-hidden className={cn(pollRowFrameClassName, 'space-y-1.5')}>
					{chip && <Skeleton className="h-5 w-24 rounded-full" />}
					<Skeleton className="h-6 w-3/4" />
					<Skeleton className="h-5 w-28" />
				</div>
			))}
		</div>
	);
}

export function PollListSkeleton() {
	const { t } = useLanguage();
	return (
		<div role="status" aria-busy className="flex flex-col gap-3">
			<span className="sr-only">{t('common.loading')}</span>
			{Array.from({ length: 3 }, (_, i) => (
				<PollCardSkeleton key={i} options={3 + (i % 2)} />
			))}
		</div>
	);
}

/** Placeholder tiles in PollTileGrid, shown while Explore's results load. */
export function PollTileGridSkeleton() {
	const { t } = useLanguage();
	return (
		<div role="status" aria-busy>
			<span className="sr-only">{t('common.loading')}</span>
			<PollTileGrid>
				{Array.from({ length: 6 }, (_, i) => (
					<li key={i} aria-hidden className={pollTileFrameClassName}>
						<Skeleton className="h-5 w-24 rounded-full" />
						<div className="space-y-2">
							<Skeleton className="h-6 w-full" />
							<Skeleton className="h-6 w-2/3" />
						</div>
						<div className="space-y-1.5">
							<Skeleton className="h-4 w-1/2" />
							<Skeleton className="h-4 w-2/5" />
						</div>
						<Skeleton className="mt-auto h-4 w-20" />
					</li>
				))}
			</PollTileGrid>
		</div>
	);
}
