'use client';

type FeedItemProps = {
	data: { title: string; description: string };
};

export function FeedItem({ data }: FeedItemProps) {
	const { title, description } = data || {};

	return (
		<div className="c-feed-item text-white border-b border-gray-300 py-4">
			<h2 className="text-2xl mb-4">{title}</h2>
			<p className="text-base">{description}</p>
		</div>
	);
}
