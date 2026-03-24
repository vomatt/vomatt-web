'use client';

import { PollCreator } from '@/components/PollCreator';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getPolls } from '@/lib/api/services/polls';
import { cn, hasArrayValue } from '@/lib/utils';
import { Pagination, Sort } from '@/types/page';
import { Poll } from '@/types/poll';

import { HomepageHeader } from './HomepageHeader';
import { PollCard } from './PollCard';

type Page = {
	content: Poll[];
	empty: boolean;
	first: boolean;
	last: boolean;
	number: number;
	numberOfElements: number;
	size: number;
	totalElements: number;
	totalPages: number;
	pageable: Pagination;
	sort: Sort;
};

type PollFeedList = {
	className?: string;
	isAuthenticated?: boolean;
};

export function PollFeedList({ className, isAuthenticated }: PollFeedList) {
	const { t } = useLanguage();
	const [mainData, setMainData] = useState<Poll[]>([]);
	const [currentPage, setCurrentPage] = useState(0);
	const [isLast, setIsLast] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		getPolls()
			.then((data) => {
				setMainData(data?.content ?? []);
				setCurrentPage(data?.number ?? 0);
				setIsLast(data?.last ?? true);
			})
			.catch(() => {
				// Feed stays empty — no crash
			});
	}, []);

	if (!hasArrayValue(mainData)) {
		return (
			<div className="flex flex-col gap-10 justify-center items-center h-svh flex-1">
				<h2 className="text-3xl">{t('homePage.feedListNoData')}</h2>
				<PollCreator triggerChildren={<Button>Create a poll</Button>} />
			</div>
		);
	}

	const loadMore = async () => {
		if (isLoading || isLast) return;
		setIsLoading(true);
		try {
			const pageData = await getPolls(currentPage + 1);
			if (pageData?.content) {
				setMainData((prev) => [...prev, ...pageData.content]);
				setCurrentPage(pageData.number);
				setIsLast(pageData.last);
			}
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
					<PollCard key={item.id} pollData={item} isAuthenticated={isAuthenticated} />
				))}
			</div>

			{!isLast && (
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
