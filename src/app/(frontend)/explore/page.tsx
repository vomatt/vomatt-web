import type { Metadata, ResolvingMetadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { Refreshable } from '@/components/Refreshable';
import { getUserSession } from '@/data/auth';
import { EXPLORE_PAGE_SIZE } from '@/features/polls/constants';
import { getPolls, getTags } from '@/features/polls/service';
import { searchUsers } from '@/lib/api/services/users';
import { getServerMessages } from '@/lib/getServerLocale';
import { pageOpenGraph } from '@/lib/pageOpenGraph';

import { ExploreView } from './_components/ExploreView';
import { filtersFromParams, toExploreQuery } from './filters';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Coming back within 3 minutes shows this page from the browser's cache instead of rendering it and
// calling the API again. Actions that revalidate drop it; pulling down refetches (`Refreshable`)
export const unstable_dynamicStaleTime = 180;

// Filtered and searched lists all point to the one Explore page
export async function generateMetadata(_props: Props, parent: ResolvingMetadata): Promise<Metadata> {
	const { messages } = await getServerMessages();
	return {
		title: messages.explore.title,
		description: messages.meta.exploreDescription,
		alternates: { canonical: '/explore' },
		openGraph: await pageOpenGraph(parent, { url: '/explore' }),
	};
}

export default async function ExplorePage({ searchParams }: Props) {
	const initial = filtersFromParams(await searchParams);
	const { query, status, sort, tag } = initial;
	// Started first, so it streams into the grid. Tiles don't vote, so nothing waits for who the
	// viewer is; `asViewer` still marks the Polls they voted in
	const exploreQuery = toExploreQuery(query, status, sort, tag);
	const firstPage = getPolls(exploreQuery, null, EXPLORE_PAGE_SIZE, { asViewer: true }).catch(() => null);
	// Awaited (cached 5 minutes), so the topic row is there at first paint instead of pushing the grid down
	const [topics, session] = await Promise.all([getTags(), getUserSession()]);
	// Only a signed-in viewer can search people; a failed lookup lists nobody
	const firstPeople =
		session && exploreQuery.q ? searchUsers(exploreQuery.q).then((page) => page.items, () => []) : Promise.resolve([]);
	return (
		<Refreshable>
			<PageShell wide className="pt-2">
				<ExploreView initialPage={firstPage} topics={topics} initial={initial} canSearchPeople={!!session} initialPeople={firstPeople} />
			</PageShell>
		</Refreshable>
	);
}
