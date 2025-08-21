import { cn, hasArrayValue } from '@/lib/utils';
import { FeedItem } from './FeedItem';

type FeedList = {
	data: {
		title: string;
		description: string;
	}[];
	className: string;
};

export function FeedList({ data, className }: FeedList) {
	if (!hasArrayValue(data)) {
		return (
			<div>
				<h2>no data</h2>
			</div>
		);
	}

	return (
		<div className={cn('p-6 bg-gray-700 max-w-2xl rounded-lg', className)}>
			{data.map((item, index) => (
				<FeedItem key={index} data={item} />
			))}
		</div>
	);
}
