'use client';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getPolls } from '@/lib/api/endpoints/polls';
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
	data: Page;
	className?: string;
};

export function PollFeedList({ data, className }: PollFeedList) {
	const [polls, setPolls] = useState<Poll[]>(data?.content ?? []);
	const [currentPage, setCurrentPage] = useState(data?.number ?? 0);
	const [isLast, setIsLast] = useState(data?.last ?? true);
	const [isLoading, setIsLoading] = useState(false);

	if (!hasArrayValue(data?.content)) {
		return (
			<div className="flex justify-center items-center">
				<h2 className="text-3xl">No Data</h2>
			</div>
		);
	}

	const loadMore = async () => {
		if (isLoading || isLast) return;
		setIsLoading(true);
		try {
			const pageData = await getPolls(currentPage + 1);
			if (pageData?.content) {
				setPolls((prev) => [...prev, ...pageData.content]);
				setCurrentPage(pageData.number);
				setIsLast(pageData.last);
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex-1 min-h-[var(--h-main)] max-w-lg">
			<HomepageHeader />
			<div
				data-testid="cFeedList"
				className={cn(
					'rounded-xl relative w-full flex flex-col gap-6 pt-2',
					className
				)}
			>
				{polls.map((item) => (
					<PollCard key={item.id} pollData={item} />
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
