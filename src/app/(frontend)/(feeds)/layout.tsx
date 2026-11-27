import type { ReactNode } from 'react';

import { PageShell } from '@/components/layout/PageShell';
import { Refreshable } from '@/components/Refreshable';
import { getUserSession } from '@/data/auth';
import { getPopularTags } from '@/features/polls/service';

import { HomepageHeader } from '../_components/HomepageHeader';
import { HomeRail } from '../_components/HomeRail';
import { getRailPolls } from '../_components/RailPolls';

/** For you, Following, Results are in and Closing soon share the pills and rail, so switching feeds swaps only the feed. */
export default async function FeedsLayout({ children }: { children: ReactNode }) {
	const [user, tags] = await Promise.all([getUserSession(), getPopularTags()]);
	const signedIn = !!user;

	return (
		<Refreshable>
			<PageShell className="pt-0 md:pt-0" rail={<HomeRail signedIn={signedIn} />}>
				{/* Holds the feed too: the pill bar sticks only within this box */}
				<div className="flex w-full max-w-feed flex-1 flex-col">
					<HomepageHeader
						tags={tags.map(({ name, slug }) => ({ name, slug }))}
						signedIn={signedIn}
						resultsUnread={signedIn ? getRailPolls().then((rail) => rail.resultsUnread) : undefined}
					/>
					{children}
				</div>
			</PageShell>
		</Refreshable>
	);
}
