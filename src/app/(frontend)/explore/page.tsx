import { PageShell } from '@/components/layout/PageShell';
import { getMyProfile, getUserSession } from '@/data/auth';
import { EXPLORE_PAGE_SIZE } from '@/features/polls/constants';
import { getPolls } from '@/features/polls/service';

import { ExploreView } from './_components/ExploreView';

export default async function ExplorePage() {
	// Started first, so it loads alongside the viewer and streams into the list
	const firstPage = getPolls({ status: 'open', sort: 'newest' }, null, EXPLORE_PAGE_SIZE, { asViewer: true }).catch(() => null);
	// The cards vote as the viewer, so the page waits for who that is
	const [user, profile] = await Promise.all([getUserSession(), getMyProfile()]);
	return (
		<PageShell>
			<ExploreView
				initialPage={firstPage}
				viewerId={user?.sub}
				anonymousByDefault={profile?.anonymousBallotByDefault}
			/>
		</PageShell>
	);
}
