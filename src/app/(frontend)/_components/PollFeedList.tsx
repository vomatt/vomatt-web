'use client';

import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useInView } from 'react-intersection-observer';

import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { PollCard } from '@/features/polls/components/PollCard';
import type { Poll } from '@/features/polls/schema';
import { getFeed } from '@/features/polls/service';
import { mergeById } from '@/lib/api/cursor';
import { cn } from '@/lib/utils';

const PollCreator = dynamic(() =>
	import('@/features/polls/components/PollCreator').then((m) => m.PollCreator)
);

type PollFeedListProps = {
	className?: string;
	viewerId?: string;
	/** Server-rendered first page; null when it couldn't be loaded. */
	initialPage: { items: Poll[]; nextCursor: string | null } | null;
	tag?: string;
	header: React.ReactNode;
};

export function PollFeedList({ className, viewerId, initialPage, tag, header }: PollFeedListProps) {
	const { t } = useLanguage();
	const [polls, setPolls] = useState(initialPage?.items ?? []);
	const [nextCursor, setNextCursor] = useState(initialPage?.nextCursor ?? null);
	const [isLoading, setIsLoading] = useState(false);
	const [loadFailed, setLoadFailed] = useState(false);

	const loadMore = useCallback(async () => {
		if (isLoading || !nextCursor) return;
		setIsLoading(true);
		setLoadFailed(false);
		try {
			const page = await getFeed(nextCursor, 10, tag);
			setPolls((prev) => mergeById(prev, page.items));
			setNextCursor(page.nextCursor);
		} catch {
			setLoadFailed(true);
		} finally {
			setIsLoading(false);
		}
	}, [isLoading, nextCursor, tag]);

	// Load the next page as the reader nears the end; the button stays as a fallback
	const { ref: sentinelRef } = useInView({
		rootMargin: '600px',
		onChange: (inView) => {
			if (inView && !loadFailed) loadMore();
		},
	});

	return (
		<div className={cn('flex-1 min-h-[var(--h-main)] max-w-[560px]', className)}>
			{header}

			{initialPage === null && (
				<div className="py-16 text-center">
					<p className="mb-4 text-muted-foreground">{t('homePage.feedFailed')}</p>
					<Button variant="outline" onClick={() => window.location.reload()}>
						{t('comments.retry')}
					</Button>
				</div>
			)}

			{initialPage !== null && polls.length === 0 && (
				<div className="flex flex-col items-center gap-6 py-20 text-center">
					<h2 className="text-3xl">{t(tag ? 'homePage.topicEmpty' : 'homePage.feedListNoData')}</h2>
					{viewerId ? (
						<PollCreator triggerChildren={<Button>{t('homePage.createFirst')}</Button>} />
					) : (
						<Button asChild>
							<Link href="/signup">{t('homePage.joinToCreate')}</Link>
						</Button>
					)}
				</div>
			)}

			<div data-testid="cFeedList" className="relative flex w-full flex-col gap-3 py-4">
				{polls.map((poll, index) => (
					<motion.div
						key={poll.id}
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: Math.min(index % 10, 5) * 0.04 }}
					>
						<PollCard poll={poll} viewerId={viewerId} />
					</motion.div>
				))}
			</div>

			{nextCursor && (
				<div ref={sentinelRef} className="flex justify-center py-6">
					{isLoading ? (
						<Spinner />
					) : (
						<Button variant="outline" onClick={loadMore} className="min-w-32">
							{loadFailed ? t('comments.retry') : t('common.loadMore')}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
