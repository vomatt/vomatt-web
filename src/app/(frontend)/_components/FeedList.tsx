import { cn, hasArrayValue } from '@/lib/utils';
import { Pagination, Sort } from '@/types/page';
import { Poll } from '@/types/poll';

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

type FeedList = {
	data: Page;
	className?: string;
};

export function FeedList({ data, className }: FeedList) {
	const { content } = data || {};

	if (!hasArrayValue(content))
		return (
			<div className="flex justify-center items-center">
				<h2 className="text-3xl">No Data</h2>
			</div>
		);

	return (
		<div
			data-testid="cFeedList"
			className={cn(
				'bg-secondary rounded-xl relative grid grid-cols-3 w-full p-3 min-h-[var(--h-main)] gap-6',
				className
			)}
		>
			{content.map((item, index) => (
				<PollCard key={index} pollData={item} />
			))}
		</div>
	);
}
