import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { FollowListDialog } from '@/features/follows/FollowListDialog';
import { followUser, getFollowers } from '@/features/follows/service';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));
jest.mock('@/features/follows/service', () => ({
	getFollowers: jest.fn(),
	getFollowing: jest.fn(),
	followUser: jest.fn(),
	unfollowUser: jest.fn(),
}));

const mockGetFollowers = getFollowers as jest.Mock;
const mockFollowUser = followUser as jest.Mock;
const relation = { isFollowing: false, followsYou: false };
const bob = { id: 'u1', username: 'bob', displayName: 'Bob Chen', avatarUrl: 'bot:boba', ...relation };
const cy = { id: 'u2', username: 'cy', displayName: null, avatarUrl: null, ...relation };
const jtan = { id: 'u3', username: 'jtan', displayName: 'Jun Tan', avatarUrl: null, ...relation, followsYou: true };
const rosa = { id: 'u4', username: 'rosa', displayName: 'Rosa Ortega', avatarUrl: null, ...relation, isFollowing: true };
const me = { id: 'me', username: 'mei', displayName: 'Mei', avatarUrl: null, ...relation };

function showList(items: object[], onFollowChange?: (following: boolean) => void) {
	mockGetFollowers.mockResolvedValue({ ok: true, data: { items, nextCursor: null } });
	render(
		<FollowListDialog username="mei" list="followers" onOpenChange={jest.fn()} viewerId="me" onFollowChange={onFollowChange} />
	);
}

const rowOf = async (name: string | RegExp) => (await screen.findByRole('link', { name })).closest('li')!;

beforeEach(() => jest.clearAllMocks());

it('lists each person as a link with their name over their @handle', async () => {
	showList([bob, cy]);

	const row = await screen.findByRole('link', { name: 'Bob Chen @bob' });
	expect(row).toHaveAttribute('href', '/bob');
	// Without a display name the username stands in, the handle still beneath it
	expect(screen.getByRole('link', { name: 'cy @cy' })).toHaveAttribute('href', '/cy');
	expect(mockGetFollowers).toHaveBeenCalledWith('mei');
});

it('offers Follow back, and says so, to someone who follows the viewer', async () => {
	showList([jtan]);

	const row = await rowOf('Jun Tan @jtan · follows you');
	const button = within(row).getByRole('button', { name: 'Follow back' });
	// Follow back is ink like Follow, but without the plus
	expect(button.querySelector('svg')).toBeNull();
});

it('shows Following for someone the viewer follows, and Follow for anyone else', async () => {
	showList([rosa, bob]);

	expect(within(await rowOf(/^Rosa Ortega/)).getByRole('button', { pressed: true })).toHaveTextContent('Following');
	expect(within(await rowOf(/^Bob Chen/)).getByRole('button', { name: 'Follow' })).toBeInTheDocument();
	expect(screen.queryByText(/follows you/)).not.toBeInTheDocument();
});

it("gives the viewer's own row no button", async () => {
	showList([me]);
	expect(within(await rowOf('Mei @mei')).queryByRole('button')).not.toBeInTheDocument();
});

it('follows from the row at once, and tells the page each change, the going back too', async () => {
	mockFollowUser.mockResolvedValue({ ok: false, message: 'Request failed' });
	const onFollowChange = jest.fn();
	showList([jtan], onFollowChange);

	fireEvent.click(within(await rowOf(/^Jun Tan/)).getByRole('button', { name: 'Follow back' }));
	expect(mockFollowUser).toHaveBeenCalledWith('u3');
	expect(onFollowChange).toHaveBeenNthCalledWith(1, true);
	// Refused: back to Follow back, and the page hears it
	expect(await screen.findByRole('button', { name: 'Follow back' })).toBeEnabled();
	await waitFor(() => expect(onFollowChange).toHaveBeenNthCalledWith(2, false));
});
