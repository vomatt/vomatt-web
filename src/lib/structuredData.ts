// schema.org JSON-LD for search engines and answer engines
import type { Poll } from '@/features/polls/schema';
import { shareDescription } from '@/features/polls/sharePreview';
import { isPublic } from '@/features/polls/status';
import { pollHref, profileHref, siteUrl } from '@/lib/routes';
import type { UserProfile } from '@/types/user';

type JsonLd = Record<string, unknown>;

const counter = (action: string, count: number | undefined) =>
	count === undefined
		? []
		: [{ '@type': 'InteractionCounter', interactionType: `https://schema.org/${action}`, userInteractionCount: count }];

/**
 * A Poll is user-asked and discussed in its Comments, which DiscussionForumPosting describes.
 * Null for Unlisted and Invite-only Polls, which are meant only for people with the link.
 */
export function pollJsonLd(poll: Poll): JsonLd | null {
	if (!isPublic(poll)) return null;
	const tags = poll.tags?.map((tag) => tag.name) ?? [];
	return {
		'@context': 'https://schema.org',
		'@type': 'DiscussionForumPosting',
		url: siteUrl(pollHref(poll.id)),
		headline: poll.title,
		text: shareDescription(poll),
		datePublished: poll.startTime,
		...(poll.updatedAt && { dateModified: poll.updatedAt }),
		author: { '@type': 'Person', name: poll.creatorUsername, url: siteUrl(profileHref(poll.creatorUsername)) },
		...(tags.length > 0 && { keywords: tags.join(', ') }),
		commentCount: poll.commentCount,
		interactionStatistic: [
			...counter('CommentAction', poll.commentCount),
			...counter('VoteAction', poll.participantCount),
		],
	};
}

export function profileJsonLd(profile: UserProfile): JsonLd {
	return {
		'@context': 'https://schema.org',
		'@type': 'ProfilePage',
		url: siteUrl(profileHref(profile.username)),
		dateCreated: profile.joinedAt,
		mainEntity: {
			'@type': 'Person',
			name: profileName(profile),
			alternateName: `@${profile.username}`,
			identifier: profile.id,
			...(profile.bio && { description: profile.bio }),
			interactionStatistic: [
				...counter('FollowAction', profile.followersCount),
				...counter('WriteAction', profile.totalPolls),
			],
		},
	};
}

/** How the app titles a person: their display name, else their @username. */
export const profileName = (profile: Pick<UserProfile, 'displayName' | 'username'>) =>
	profile.displayName || `@${profile.username}`;

export function websiteJsonLd({ name, description }: { name: string; description: string }): JsonLd {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name,
		description,
		url: siteUrl(),
		potentialAction: {
			'@type': 'SearchAction',
			target: siteUrl('/explore?q={search_term_string}'),
			'query-input': 'required name=search_term_string',
		},
	};
}

/** Escapes `<` so user text can't close the <script> it is written into. */
export function serializeJsonLd(data: JsonLd) {
	return JSON.stringify(data).replace(/</g, '\\u003c');
}
