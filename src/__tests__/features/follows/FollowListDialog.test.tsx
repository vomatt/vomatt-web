import { render, screen } from '@testing-library/react';

import { FollowListDialog } from '@/features/follows/FollowListDialog';
import { getFollowers } from '@/features/follows/service';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('@/features/follows/service', () => ({ getFollowers: jest.fn(), getFollowing: jest.fn() }));

const mockGetFollowers = getFollowers as jest.Mock;
const bob = { id: 'u1', username: 'bob', displayName: 'Bob Chen', avatarUrl: 'bot:boba' };
const cy = { id: 'u2', username: 'cy', displayName: null, avatarUrl: null };

it('lists each person as a link with their name over their @handle', async () => {
	mockGetFollowers.mockResolvedValue({ ok: true, data: { items: [bob, cy], nextCursor: null } });
	render(<FollowListDialog username="mei" list="followers" onOpenChange={jest.fn()} />);

	const row = await screen.findByRole('link', { name: 'Bob Chen @bob' });
	expect(row).toHaveAttribute('href', '/bob');
	// Without a display name the username stands in, the handle still beneath it
	expect(screen.getByRole('link', { name: 'cy @cy' })).toHaveAttribute('href', '/cy');
	expect(mockGetFollowers).toHaveBeenCalledWith('mei');
});
