import { render, screen } from '@testing-library/react';

import CommunityMembersPage from '@/app/(frontend)/[slug]/settings/members/page';
import { ActingProvider } from '@/features/communities/ActingProvider';
import type { CommunityRole, MyCommunity } from '@/features/communities/schema';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockRedirect = jest.fn((href: string) => {
	throw new Error(`NEXT_REDIRECT ${href}`);
});
jest.mock('next/navigation', () => ({
	useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
	notFound: jest.fn(),
	redirect: (href: string) => mockRedirect(href),
}));
jest.mock('@/lib/getServerLocale', () => ({ getServerMessages: jest.fn() }));
const mockMyCommunities = jest.fn();
const mockLoadActingState = jest.fn();
jest.mock('@/data/auth', () => ({
	getMyProfile: async () => ({ id: 'u1', username: 'klaus' }),
	getTokenSession: async () => ({ sub: 'u1' }),
	getMyCommunities: () => mockMyCommunities(),
	loadActingState: () => mockLoadActingState(),
	redirectToLogin: jest.fn(),
}));
const mockListMembers = jest.fn(async (_communityId: string) => ({ ok: true, data: [] }));
jest.mock('@/features/communities/service', () => ({
	listMembers: (communityId: string) => mockListMembers(communityId),
	listInvitations: async () => ({ ok: true, data: [] }),
}));
jest.mock('@/lib/api/services/users', () => ({ getUserProfile: async () => null }));
jest.mock('@/features/communities/CommunityMembers', () => ({ CommunityMembers: () => <p>Members list</p> }));
jest.mock('@/features/communities/CommunityProfileCard', () => ({ CommunityProfileCard: () => null }));
jest.mock('@/features/communities/DeleteCommunity', () => ({ DeleteCommunity: () => null }));

const community = (role: CommunityRole): MyCommunity => ({
	communityId: 'c1',
	username: 'club',
	displayName: 'Robotics Club',
	avatarUrl: null,
	role,
});

const renderPage = async (role: CommunityRole, acting: MyCommunity | null, slug = 'club') => {
	mockMyCommunities.mockResolvedValue({ ok: true, data: [community(role)] });
	mockLoadActingState.mockResolvedValue({ acting });
	const page = await CommunityMembersPage({ params: Promise.resolve({ slug }) });
	render(<ActingProvider state={{ acting, me: null, communities: [community(role)], stale: false }}>{page}</ActingProvider>);
};

beforeEach(() => mockListMembers.mockClear());

const blockedLink = () => screen.queryByRole('link', { name: /Blocked people/ });

describe('Community members page, blocked people', () => {
	it('links to the account’s blocked people while acting as it', async () => {
		await renderPage('ADMIN', community('ADMIN'));
		expect(blockedLink()).toHaveAttribute('href', '/settings/blocked');
	});

	it('leaves it out when not acting as the account, where that page lists the person’s own', async () => {
		await renderPage('OWNER', null);
		expect(blockedLink()).not.toBeInTheDocument();
	});

	it('leaves it out for a role that can’t block for the account', async () => {
		await renderPage('EDITOR', community('EDITOR'));
		expect(blockedLink()).not.toBeInTheDocument();
	});
});

describe('Community members page, under the account’s profile', () => {
	it('finds the community by its username', async () => {
		await renderPage('OWNER', null);
		expect(mockListMembers).toHaveBeenCalledWith('c1');
		expect(screen.getByText('Members list')).toBeInTheDocument();
	});

	it('sends a differently cased username to the account’s own', async () => {
		await expect(renderPage('OWNER', null, 'Club')).rejects.toThrow('NEXT_REDIRECT /club/settings/members');
		expect(mockListMembers).not.toHaveBeenCalled();
	});

	it('leads back to the account’s profile while acting as it', async () => {
		await renderPage('OWNER', community('OWNER'));
		expect(screen.getByRole('link', { name: /Robotics Club/ })).toHaveAttribute('href', '/club');
	});

	it('leads back to Settings, where it was opened from, when not acting as it', async () => {
		await renderPage('ANALYST', null);
		expect(screen.getByRole('link', { name: 'Back to Settings' })).toHaveAttribute('href', '/settings');
	});

	it('says the viewer isn’t a member of an account that isn’t one of theirs', async () => {
		await renderPage('OWNER', null, 'someone_else');
		expect(mockListMembers).not.toHaveBeenCalled();
		expect(screen.queryByText('Members list')).not.toBeInTheDocument();
	});
});
