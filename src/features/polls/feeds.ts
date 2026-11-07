/** The home page's feeds, in the order their pills show. Every one but For you needs sign-in. */
export type FeedKind = 'forYou' | 'following' | 'resultsIn' | 'closingSoon';

/** The feeds with a side card in the rail from xl, whose title links to the feed. */
export const RAIL_FEEDS = ['resultsIn', 'closingSoon'] as const satisfies FeedKind[];
export type RailFeedKind = (typeof RAIL_FEEDS)[number];

export const isRailFeed = (kind: FeedKind): kind is RailFeedKind => (RAIL_FEEDS as readonly FeedKind[]).includes(kind);

type Feed = {
	href: string;
	label: string;
	/** What an empty feed says; `explore` adds a way to find polls. For you has its own. */
	empty?: { title: string; hint: string; explore?: string };
};

export const FEEDS: Record<FeedKind, Feed> = {
	forYou: { href: '/', label: 'homePage.allTopics' },
	following: {
		href: '/following',
		label: 'homePage.following',
		empty: {
			title: 'homePage.followingEmpty',
			hint: 'homePage.followingEmptyHint',
			explore: 'homePage.followingEmptyCta',
		},
	},
	resultsIn: {
		href: '/results-in',
		label: 'homePage.resultsIn',
		empty: { title: 'homePage.resultsInEmpty', hint: 'homePage.resultsInEmptyHint' },
	},
	closingSoon: {
		href: '/closing-soon',
		label: 'homePage.closingSoon',
		empty: { title: 'homePage.closingSoonEmpty', hint: 'homePage.closingSoonEmptyHint' },
	},
};

export const FEED_KINDS = Object.keys(FEEDS) as FeedKind[];

/** Root segments of the feeds that need sign-in, e.g. `following`: the proxy protects them and robots skip them. */
export const SIGNED_IN_FEED_ROOTS = FEED_KINDS.filter((kind) => kind !== 'forYou').map((kind) => FEEDS[kind].href.slice(1));
