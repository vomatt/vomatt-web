import type { ResolvingMetadata } from 'next';

import { generateMetadata as homeMetadata } from '@/app/(frontend)/(home)/page';
import { generateMetadata as profileMetadata } from '@/app/(frontend)/[slug]/page';
import { generateMetadata as exploreMetadata } from '@/app/(frontend)/explore/page';
import en from '@/locales/en.json';

const mockGetUserProfile = jest.fn();
jest.mock('@/lib/api/services/users', () => ({
	getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
}));
jest.mock('@/lib/getServerLocale', () => ({
	getServerMessages: async () => ({ language: 'en', messages: jest.requireActual('@/locales/en.json') }),
}));
jest.mock('@/data/auth', () => ({ getMyProfile: jest.fn(), getUserSession: jest.fn() }));
const mockGetTags = jest.fn();
jest.mock('@/features/polls/service', () => ({
	getTagBySlug: async (slug: string) => (await mockGetTags()).find((tag: { slug: string }) => tag.slug === slug),
}));
jest.mock('@/lib/siteSettings', () => ({ getSiteSettings: jest.fn() }));
jest.mock('@/app/(frontend)/[slug]/_components/Profile', () => ({}));
jest.mock('@/app/(frontend)/explore/_components/ExploreView', () => ({}));
jest.mock('@/app/(frontend)/_components/HomepageHeader', () => ({}));
jest.mock('@/app/(frontend)/_components/HomeRail', () => ({}));
jest.mock('@/app/(frontend)/_components/PollFeedList', () => ({}));

const site = { type: 'website', siteName: 'Vomatt', locale: 'en_US' };
const parent = Promise.resolve({ openGraph: site }) as unknown as ResolvingMetadata;

const profileFor = (slug: string) =>
	profileMetadata({ params: Promise.resolve({ slug }), searchParams: Promise.resolve({}) }, parent);

describe('profile page metadata', () => {
	const profile = { id: 'u1', username: 'alice', displayName: 'Alice', bio: null };

	it('describes a profile by its bio', async () => {
		mockGetUserProfile.mockResolvedValue({ ...profile, bio: 'Asks about food' });
		expect((await profileFor('alice')).description).toBe('Asks about food');
	});

	it('describes a profile without a bio by its name', async () => {
		mockGetUserProfile.mockResolvedValue(profile);
		expect((await profileFor('alice')).description).toBe('See the polls Alice has asked.');
	});

	it('names the lowercase username URL as canonical', async () => {
		mockGetUserProfile.mockResolvedValue(profile);
		expect((await profileFor('Alice')).alternates).toEqual({ canonical: '/alice' });
	});

	it('titles an unknown profile as not found', async () => {
		mockGetUserProfile.mockResolvedValue(null);
		expect(await profileFor('nobody')).toEqual({ title: 'Page not found' });
	});
});

describe('Explore metadata', () => {
	it('points every filtered list at the one Explore page', async () => {
		expect(await exploreMetadata({ searchParams: Promise.resolve({ q: 'pizza' }) }, parent)).toEqual({
			title: en.explore.title,
			description: en.meta.exploreDescription,
			alternates: { canonical: '/explore' },
			openGraph: { ...site, url: '/explore' },
		});
	});
});

describe('home metadata', () => {
	const metadataFor = (tag?: string | string[]) => homeMetadata({ searchParams: Promise.resolve({ tag }) }, parent);
	const canonicalFor = async (tag?: string | string[]) => (await metadataFor(tag)).alternates?.canonical;

	beforeEach(() => {
		mockGetTags.mockResolvedValue([
			{ id: 't1', name: 'Food', slug: 'food' },
			{ id: 't2', name: 'Music', slug: 'music', description: 'Songs and artists' },
		]);
	});

	it('titles a topic feed by its topic', async () => {
		expect(await metadataFor('food')).toMatchObject({
			title: 'Food',
			description: 'Polls about Food. Vote on the open ones and see what everyone thinks.',
		});
	});

	it('describes a topic feed by the topic\'s own description when it has one', async () => {
		expect((await metadataFor('music')).description).toBe('Songs and artists');
	});

	it('leaves the site title on an unknown topic', async () => {
		expect(await metadataFor('nope')).not.toHaveProperty('title');
	});

	it.each(['nope', 'Food'])('treats ?tag=%s, which names no topic, as the home page', async (tag) => {
		expect(await canonicalFor(tag)).toBe('/');
	});

	it('shares a page under its canonical URL, with the site name', async () => {
		expect((await metadataFor('food')).openGraph).toEqual({ ...site, url: '/?tag=food' });
	});

	it('names the home page canonical', async () => {
		expect(await canonicalFor()).toBe('/');
	});

	it('gives a topic feed its own canonical, from the first ?tag=', async () => {
		expect(await canonicalFor(['food', 'music'])).toBe('/?tag=food');
	});
});
