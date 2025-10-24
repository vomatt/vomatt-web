import { cn, hasArrayValue } from '@/lib/utils';
import { Pagination, Sort } from '@/types/page';
import { Poll } from '@/types/poll';

import { HomepageHeader } from './HomepageHeader';
import { PollCard } from './PollCard';

type Page = {
	content: Poll[]; // optional if omitted in your data
	empty: boolean;
	first: boolean;
	last: boolean;
	number: number; // current page number (0-based)
	numberOfElements: number;
	size: number; // page size
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
	const { content } = data || {};

	if (!hasArrayValue(content))
		return (
			<div className="flex justify-center items-center">
				<h2 className="text-3xl">No Data</h2>
			</div>
		);

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
				{content.map((item, index) => (
					<PollCard key={index} pollData={item} />
				))}
			</div>
		</div>
	);
}
