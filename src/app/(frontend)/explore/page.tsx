import { EXPLORE_PAGE_SIZE } from '@/features/polls/constants';
import { getPolls, getPopularTags } from '@/features/polls/service';

import { ExploreView } from './_components/ExploreView';

export default async function ExplorePage() {
	// Started first, so it loads alongside the topics and streams into the list
	const firstPage = getPolls({ status: 'open', sort: 'newest' }, null, EXPLORE_PAGE_SIZE).catch(() => null);
	// Topics sit above everything else, so the page waits for them (cached for
	// five minutes) instead of reserving space that may stay empty
	const tags = await getPopularTags(30);
	return (
		<div className="px-contain mx-auto max-w-2xl py-6">
			<ExploreView initialPage={firstPage} tags={tags} />
		</div>
	);
}
