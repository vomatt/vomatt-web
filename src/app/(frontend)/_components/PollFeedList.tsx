'use client';

import { m } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';
import { useInView } from 'react-intersection-observer';

import { EmptyCard } from '@/components/EmptyCard';
import { Button, buttonVariants } from '@/components/ui/Button';
import { CircleMinus } from '@/components/ui/CircleMinus';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { CreatePollTrigger } from '@/features/polls/components/CreatePollTrigger';
import { PollCard } from '@/features/polls/components/PollCard';
import type { Poll } from '@/features/polls/schema';
import { getFeed, getFollowingFeed } from '@/features/polls/service';
import { mergeById } from '@/lib/api/cursor';
import { cn } from '@/lib/utils';

type PollFeedListProps = {
	className?: string;
	viewerId?: string;
	anonymousByDefault?: boolean;
	/** Server-rendered first page; null when it couldn't be loaded. */
	initialPage: { items: Poll[]; nextCursor: string | null } | null;
	tag?: string;
	/** Only Polls by followed people, instead of the home feed. */
	following?: boolean;
	header: React.ReactNode;
};

export function PollFeedList({
	className,
	viewerId,
	anonymousByDefault,
	initialPage,
	tag,
	following,
	header,
}: PollFeedListProps) {
	const { t } = useLanguage();
	// Seeded from the server's first page; a new first page remounts the list (see page.tsx)
	const [polls, setPolls] = useState(initialPage?.items ?? []);
	// The server-rendered page shows at once; only cards loaded later fade in
	const [firstPageCount] = useState(polls.length);
	const [nextCursor, setNextCursor] = useState(initialPage?.nextCursor ?? null);
	const [isLoading, setIsLoading] = useState(false);
	const [loadFailed, setLoadFailed] = useState(false);

	const loadMore = async () => {
		if (isLoading || !nextCursor) return;
		setIsLoading(true);
		setLoadFailed(false);
		try {
			const page = following ? await getFollowingFeed(nextCursor) : await getFeed(nextCursor, 10, tag);
			setPolls((prev) => mergeById(prev, page.items));
			setNextCursor(page.nextCursor);
		} catch {
			setLoadFailed(true);
		} finally {
			setIsLoading(false);
		}
	};

	// Load the next page as the reader nears the end; the button stays as a fallback
	const { ref: sentinelRef } = useInView({
		rootMargin: '600px',
		onChange: (inView) => {
			if (inView && !loadFailed) loadMore();
		},
	});

	return (
		<div
			// With the topics' own padding, the pills sit 24px below the top
			className={cn('w-full flex-1 min-h-[var(--h-main)] max-w-feed pt-4', className)}
		>
			{header}

			{initialPage === null && (
				<div className="py-16 text-center">
					<p className="mb-4 text-muted-foreground">
						{t('homePage.feedFailed')}
					</p>
					<Button variant="outline" onClick={() => window.location.reload()}>
						{t('comments.retry')}
					</Button>
				</div>
			)}

			{initialPage !== null && polls.length === 0 && following && (
				<EmptyCard
					className="mt-2"
					icon={<CircleMinus />}
					title={t('homePage.followingEmpty')}
					body={t('homePage.followingEmptyHint')}
					action={
						<Link href="/explore" className={buttonVariants({ variant: 'outline' })}>
							{t('homePage.followingEmptyCta')}
						</Link>
					}
				/>
			)}

			{initialPage !== null && polls.length === 0 && !following && (
				<div className="flex flex-col items-center gap-6 py-20 text-center">
					<h2 className="text-3xl">
						{t(tag ? 'homePage.topicEmpty' : 'homePage.feedListNoData')}
					</h2>
					{viewerId ? (
						<CreatePollTrigger>
							<Button>{t('homePage.createFirst')}</Button>
						</CreatePollTrigger>
					) : (
						<Link href="/login" className={buttonVariants()}>
							{t('homePage.joinToCreate')}
						</Link>
					)}
				</div>
			)}

			<div
				data-testid="cFeedList"
				className="relative flex w-full flex-col gap-4 pt-2"
			>
				{polls.map((poll, index) => (
					<m.div
						key={poll.id}
						initial={index < firstPageCount ? false : { opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.3,
							delay: Math.min(index % 10, 5) * 0.04,
						}}
					>
						<PollCard poll={poll} viewerId={viewerId} anonymousByDefault={anonymousByDefault} />
					</m.div>
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
