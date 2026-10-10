'use client';

import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';

/** "Load more" for a cursor list; offers a retry after a failed page. */
export function LoadMore({
	list,
}: {
	list: { hasMore: boolean; isLoading: boolean; loadFailed: boolean; loadMore: () => void };
}) {
	const { t } = useLanguage();
	if (!list.hasMore) return null;
	return (
		<div className="flex justify-center py-4">
			{list.isLoading ? (
				<Spinner />
			) : (
				<Button variant="outline" onClick={list.loadMore} className="min-w-32">
					{list.loadFailed ? t('comments.retry') : t('common.loadMore')}
				</Button>
			)}
		</div>
	);
}
