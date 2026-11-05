import type { Poll } from '@/features/polls/schema';
import { pollJsonLd, profileJsonLd, serializeJsonLd, websiteJsonLd } from '@/lib/structuredData';
import type { UserProfile } from '@/types/user';

const originalSiteUrl = process.env.SITE_URL;
beforeEach(() => {
	process.env.SITE_URL = 'https://vomatt.com';
});
afterAll(() => {
	process.env.SITE_URL = originalSiteUrl;
});

const poll = {
	id: 'p1',
	title: 'Market night?',
	description: 'Friday or Saturday',
	creatorUsername: 'alice',
	createdAt: '2026-11-01T10:00:00Z',
	startTime: '2026-11-01T10:00:00Z',
	updatedAt: null,
	commentCount: 3,
	participantCount: 12,
	options: [
		{ id: 'o1', text: 'Friday' },
		{ id: 'o2', text: 'Saturday' },
	],
	tags: [{ id: 't1', name: 'Food', slug: 'food' }],
} as unknown as Poll;

describe('pollJsonLd', () => {
	it('describes a poll as a discussion posting at its canonical URL', () => {
		const data = pollJsonLd(poll);
		expect(data).toMatchObject({
			'@type': 'DiscussionForumPosting',
			url: 'https://vomatt.com/poll/p1',
			headline: 'Market night?',
			text: 'Friday or Saturday\nFriday / Saturday',
			datePublished: '2026-11-01T10:00:00Z',
			author: { '@type': 'Person', name: 'alice', url: 'https://vomatt.com/alice' },
			keywords: 'Food',
			commentCount: 3,
		});
	});

	it('counts comments and participants', () => {
		expect(pollJsonLd(poll)?.interactionStatistic).toEqual([
			{ '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: 3 },
			{ '@type': 'InteractionCounter', interactionType: 'https://schema.org/VoteAction', userInteractionCount: 12 },
		]);
	});

	it('leaves out what the poll does not have', () => {
		const data = pollJsonLd({ ...poll, tags: null, commentCount: undefined, participantCount: undefined });
		expect(data).not.toHaveProperty('keywords');
		expect(data?.commentCount).toBeUndefined();
		expect(data?.interactionStatistic).toEqual([]);
	});

	it.each(['unlisted', 'invite-only'] as const)('gives crawlers nothing about a %s poll', (audience) => {
		expect(pollJsonLd({ ...poll, audience })).toBeNull();
	});
});

describe('profileJsonLd', () => {
	const profile = {
		id: 'u1',
		username: 'alice',
		displayName: 'Alice',
		bio: 'Asks about food',
		joinedAt: '2026-01-01T00:00:00Z',
		followersCount: 4,
		totalPolls: 7,
	} as UserProfile;

	it('describes the person the profile is about', () => {
		expect(profileJsonLd(profile)).toMatchObject({
			'@type': 'ProfilePage',
			url: 'https://vomatt.com/alice',
			dateCreated: '2026-01-01T00:00:00Z',
			mainEntity: {
				'@type': 'Person',
				name: 'Alice',
				alternateName: '@alice',
				identifier: 'u1',
				description: 'Asks about food',
			},
		});
	});

	it('names a person without a display name by username', () => {
		expect(profileJsonLd({ ...profile, displayName: null, bio: null }).mainEntity).toMatchObject({
			name: '@alice',
		});
	});
});

describe('websiteJsonLd', () => {
	it('points site search at Explore', () => {
		expect(websiteJsonLd({ name: 'Vomatt', description: 'Polls' })).toMatchObject({
			'@type': 'WebSite',
			url: 'https://vomatt.com',
			potentialAction: {
				'@type': 'SearchAction',
				target: 'https://vomatt.com/explore?q={search_term_string}',
			},
		});
	});
});

describe('serializeJsonLd', () => {
	it('cannot close the script tag it is written into', () => {
		expect(serializeJsonLd({ text: '</script><script>alert(1)</script>' })).not.toContain('</script>');
	});
});
