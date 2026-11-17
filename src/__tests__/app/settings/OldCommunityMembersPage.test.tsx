import { render, screen } from '@testing-library/react';

import OldCommunityMembersPage from '@/app/(frontend)/settings/communities/[communityId]/members/page';

const mockRedirect = jest.fn();
const mockNotFound = jest.fn(() => {
	throw new Error('NEXT_NOT_FOUND');
});
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('@/components/BackLink', () => ({ useReturnTo: () => undefined }));
jest.mock('next/navigation', () => ({ redirect: (href: string) => mockRedirect(href), notFound: () => mockNotFound() }));
const mockMyCommunities = jest.fn();
jest.mock('@/data/auth', () => ({ getMyCommunities: () => mockMyCommunities() }));

const open = (communityId: string) => OldCommunityMembersPage({ params: Promise.resolve({ communityId }) });

beforeEach(() => {
	mockRedirect.mockClear();
	mockNotFound.mockClear();
	mockMyCommunities.mockResolvedValue({ ok: true, data: [{ communityId: 'c1', username: 'club', role: 'OWNER' }] });
});

describe('Old community members URL', () => {
	it('redirects to the members page under the account’s profile', async () => {
		await open('c1');
		expect(mockRedirect).toHaveBeenCalledWith('/club/settings/members');
	});

	it('says the person isn’t a member of an account that isn’t one of theirs', async () => {
		render(await open('c9'));
		expect(mockRedirect).not.toHaveBeenCalled();
		expect(screen.getByText('You’re not a member')).toBeInTheDocument();
	});

	it('fails rather than saying not found when the accounts can’t be loaded', async () => {
		mockMyCommunities.mockResolvedValue({ ok: false, errorCode: 'network' });
		await expect(open('c1')).rejects.not.toThrow('NEXT_NOT_FOUND');
		expect(mockNotFound).not.toHaveBeenCalled();
	});
});
