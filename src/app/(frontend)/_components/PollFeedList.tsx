'use client';

import { PollCreator } from '@/features/polls/components/PollCreator';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Poll } from '@/features/polls/schema';
import { getFeed } from '@/features/polls/service';
import { mergeById } from '@/lib/api/cursor';
import { cn, hasArrayValue } from '@/lib/utils';

import { HomepageHeader } from './HomepageHeader';
import { PollCard } from '@/features/polls/components/PollCard';

type PollFeedList = {
	className?: string;
	viewerUsername?: string;
};

export function PollFeedList({ className, viewerUsername }: PollFeedList) {
	const { t } = useLanguage();
	const [mainData, setMainData] = useState<Poll[]>([]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	useEffect(() => {
		getFeed()
			.then((page) => {
				setMainData(page.items);
				setNextCursor(page.nextCursor);
			})
			.catch(() => {
				// Feed stays empty — no crash
			})
			.finally(() => setIsInitialLoading(false));
	}, []);

	if (isInitialLoading) {
		return (
			<div className="flex-1 min-h-[var(--h-main)] flex items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (!hasArrayValue(mainData)) {
		return (
			<div className="flex flex-col gap-10 justify-center items-center h-svh flex-1">
				<h2 className="text-3xl">{t('homePage.feedListNoData')}</h2>
				<PollCreator triggerChildren={<Button>Create a poll</Button>} />
			</div>
		);
	}

	const loadMore = async () => {
		if (isLoading || !nextCursor) return;
		setIsLoading(true);
		try {
			const page = await getFeed(nextCursor);
			setMainData((prev) => mergeById(prev, page.items));
			setNextCursor(page.nextCursor);
		} catch {
			toast.error('Failed to load more polls. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex-1 min-h-[var(--h-main)] max-w-[560px]">
			<HomepageHeader />
			<div
				data-testid="cFeedList"
				className={cn('relative w-full flex flex-col gap-3 py-4', className)}
			>
				{mainData.map((item) => (
					<PollCard key={item.id} poll={item} viewerUsername={viewerUsername} />
				))}
			</div>

			{nextCursor && (
				<div className="flex justify-center py-6">
					<Button
						variant="outline"
						onClick={loadMore}
						disabled={isLoading}
						className="min-w-32"
					>
						{isLoading ? <Spinner className="w-4 h-4" /> : 'Load more'}
					</Button>
				</div>
			)}
		</div>
	);
}
