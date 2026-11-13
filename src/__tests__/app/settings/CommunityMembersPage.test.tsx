import { render, screen } from '@testing-library/react';

import CommunityMembersPage from '@/app/(frontend)/settings/communities/[communityId]/members/page';
import { ActingProvider } from '@/features/communities/ActingProvider';
import type { CommunityRole, MyCommunity } from '@/features/communities/schema';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }) }));
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
jest.mock('@/features/communities/service', () => ({
	listMembers: async () => ({ ok: true, data: [] }),
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

const renderPage = async (role: CommunityRole, acting: MyCommunity | null) => {
	mockMyCommunities.mockResolvedValue({ ok: true, data: [community(role)] });
	mockLoadActingState.mockResolvedValue({ acting });
	const page = await CommunityMembersPage({ params: Promise.resolve({ communityId: 'c1' }) });
	render(<ActingProvider state={{ acting, me: null, communities: [community(role)], stale: false }}>{page}</ActingProvider>);
};

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
