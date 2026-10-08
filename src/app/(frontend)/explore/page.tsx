import { getPopularTags, getRecentPolls } from '@/features/polls/service';

import { ExploreView } from './_components/ExploreView';

export default async function ExplorePage() {
	const [polls, tags] = await Promise.all([
		getRecentPolls().catch(() => []),
		getPopularTags(30),
	]);
	return <ExploreView polls={polls} tags={tags} />;
}
