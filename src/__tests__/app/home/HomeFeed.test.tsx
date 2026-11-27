import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import HomePage from '@/app/(frontend)/(feeds)/(home)/page';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockSession = jest.fn();
jest.mock('@/data/auth', () => ({ getMyProfile: async () => null, getUserSession: () => mockSession() }));
jest.mock('@/features/polls/service', () => ({
	getFeed: async () => ({ items: [], nextCursor: null }),
	getTagBySlug: async (slug: string) => ({ id: 't1', name: 'Housing', slug }),
	getFollowedTags: async () => ({ ok: true, data: [] }),
	followTag: jest.fn(),
	unfollowTag: jest.fn(),
}));
jest.mock('@/lib/getServerLocale', () => ({
	getServerMessages: async () => ({ language: 'en', messages: jest.requireActual('@/locales/en.json') }),
}));
jest.mock('@/lib/siteSettings', () => ({ getSiteSettings: async () => null }));
jest.mock('@/app/(frontend)/_components/PollFeedList', () => ({ PollFeedList: () => null }));

/** The page streams its feed in behind Suspense; this renders that async part directly. */
async function renderFeed(tag?: string) {
	const page = (await HomePage({ searchParams: Promise.resolve({ tag }) })) as ReactElement<{ children: ReactElement[] }>;
	const suspense = page.props.children[1] as ReactElement<{ children: ReactElement }>;
	const feed = suspense.props.children as ReactElement<object, (props: object) => Promise<ReactElement>>;
	render(await feed.type(feed.props));
}

describe('home feed', () => {
	it('offers Follow on a topic page to a signed-in viewer', async () => {
		mockSession.mockResolvedValue({ sub: 'u1' });
		await renderFeed('housing');
		expect(screen.getByRole('button', { name: 'Follow topic' })).toBeInTheDocument();
	});

	it('offers no Follow to a guest on a topic page', async () => {
		mockSession.mockResolvedValue(null);
		await renderFeed('housing');
		expect(screen.queryByRole('button', { name: /topic/ })).not.toBeInTheDocument();
	});

	it('offers no Follow off a topic page', async () => {
		mockSession.mockResolvedValue({ sub: 'u1' });
		await renderFeed();
		expect(screen.queryByRole('button', { name: /topic/ })).not.toBeInTheDocument();
	});
});
