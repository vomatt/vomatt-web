import { getFeed, getPopularTags } from '@/features/polls/service';

import { ExploreView } from './_components/ExploreView';

export default async function ExplorePage() {
	const [page, tags] = await Promise.all([
		getFeed(null, 50).catch(() => null),
		getPopularTags(30),
	]);
	return <ExploreView polls={page?.items ?? []} tags={tags} />;
}
