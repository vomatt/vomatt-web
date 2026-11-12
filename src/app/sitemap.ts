import type { MetadataRoute } from 'next';

import type { Poll } from '@/features/polls/schema';
import { getPolls } from '@/features/polls/service';
import { isRevealed, revealTime } from '@/features/polls/status';
import { collectPages, MAX_PAGE_SIZE } from '@/lib/api/cursor';
import { pollHref, siteUrl } from '@/lib/routes';

/** A Poll changed when its counts came out: at its end, or its `revealAt`. */
function lastModified(poll: Poll) {
	const edited = poll.updatedAt ?? poll.startTime;
	const ended = isRevealed(poll) ? revealTime(poll) : null;
	return ended && Date.parse(ended) > Date.parse(edited) ? ended : edited;
}

// Up to 1,000 Polls per status; a sitemap file holds 50,000 URLs
const SITEMAP_MAX_PAGES = 20;

// About and the legal pages moved to the about site. Lists only hold public Polls;
// a failed list leaves its Polls out rather than failing the sitemap
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const pages = await Promise.all(
		(['open', 'ended'] as const).map((status) =>
			collectPages((cursor) => getPolls({ status }, cursor, MAX_PAGE_SIZE), { maxPages: SITEMAP_MAX_PAGES }).catch(
				() => null
			)
		)
	);
	const polls = pages.flatMap((page) => page?.items ?? []);
	return [
		{ url: siteUrl() },
		{ url: siteUrl('/explore') },
		...polls.map((poll) => ({ url: siteUrl(pollHref(poll.id)), lastModified: lastModified(poll) })),
	];
}
