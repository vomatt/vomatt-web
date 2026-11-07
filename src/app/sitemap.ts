import type { MetadataRoute } from 'next';

import type { Poll } from '@/features/polls/schema';
import { getPolls } from '@/features/polls/service';
import { MAX_PAGE_SIZE } from '@/lib/api/cursor';
import { pollHref, siteUrl } from '@/lib/routes';

/** An Ended Poll changed when it ended: its counts were sealed until then. */
function lastModified(poll: Poll) {
	const edited = poll.updatedAt ?? poll.startTime;
	const ended = poll.endTime && Date.parse(poll.endTime) <= Date.now() ? poll.endTime : null;
	return ended && Date.parse(ended) > Date.parse(edited) ? ended : edited;
}

// About and the legal pages moved to the about site. Lists only hold public Polls;
// a failed list leaves its Polls out rather than failing the sitemap
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const pages = await Promise.all(
		(['open', 'ended'] as const).map((status) =>
			getPolls({ status }, null, MAX_PAGE_SIZE).catch(() => null)
		)
	);
	const polls = pages.flatMap((page) => page?.items ?? []);
	return [
		{ url: siteUrl() },
		{ url: siteUrl('/explore') },
		...polls.map((poll) => ({ url: siteUrl(pollHref(poll.id)), lastModified: lastModified(poll) })),
	];
}
