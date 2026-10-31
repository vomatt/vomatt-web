import { PageShell } from '@/components/layout/PageShell';
import { EXPLORE_PAGE_SIZE } from '@/features/polls/constants';
import { getPolls, getTags } from '@/features/polls/service';

import { ExploreView } from './_components/ExploreView';
import { filtersFromParams, toExploreQuery } from './filters';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ExplorePage({ searchParams }: Props) {
	const initial = filtersFromParams(await searchParams);
	const { query, status, sort, tag } = initial;
	// Started first, so it streams into the grid. Tiles don't vote, so nothing waits for who the
	// viewer is; `asViewer` still marks the Polls they voted in
	const firstPage = getPolls(toExploreQuery(query, status, sort, tag), null, EXPLORE_PAGE_SIZE, { asViewer: true }).catch(() => null);
	// Awaited (cached 5 minutes), so the topic row is there at first paint instead of pushing the grid down
	const topics = await getTags();
	return (
		<PageShell wide>
			<ExploreView initialPage={firstPage} topics={topics} initial={initial} />
		</PageShell>
	);
}
