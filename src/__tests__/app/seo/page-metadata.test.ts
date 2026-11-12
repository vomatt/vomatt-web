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
jest.mock('@/features/polls/service', () => ({}));
jest.mock('@/lib/siteSettings', () => ({ getSiteSettings: jest.fn() }));
jest.mock('@/app/(frontend)/[slug]/_components/Profile', () => ({}));
jest.mock('@/app/(frontend)/explore/_components/ExploreView', () => ({}));
jest.mock('@/app/(frontend)/_components/HomepageHeader', () => ({}));
jest.mock('@/app/(frontend)/_components/HomeRail', () => ({}));
jest.mock('@/app/(frontend)/_components/PollFeedList', () => ({}));

const profileFor = (slug: string) =>
	profileMetadata({ params: Promise.resolve({ slug }), searchParams: Promise.resolve({}) });

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
		expect(await exploreMetadata()).toEqual({
			title: en.explore.title,
			description: en.meta.exploreDescription,
			alternates: { canonical: '/explore' },
		});
	});
});

describe('home metadata', () => {
	const canonicalFor = async (tag?: string | string[]) =>
		(await homeMetadata({ searchParams: Promise.resolve({ tag }) })).alternates?.canonical;

	it('names the home page canonical', async () => {
		expect(await canonicalFor()).toBe('/');
	});

	it('gives a topic feed its own canonical, from the first ?tag=', async () => {
		expect(await canonicalFor(['food', 'music'])).toBe('/?tag=food');
	});
});
