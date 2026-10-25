import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import FollowersSheet from '@/app/(frontend)/[slug]/_components/FollowersSheet';
import { getFollowers, getFollowing } from '@/features/follows/service';

jest.mock('@/features/follows/service', () => ({
	getFollowers: jest.fn(),
	getFollowing: jest.fn(),
}));
jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));
jest.mock('next/link', () => ({
	__esModule: true,
	default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const mockFollowers = getFollowers as jest.Mock;
const mockFollowing = getFollowing as jest.Mock;

const bob = { id: 'u1', username: 'bob', displayName: 'Bob Kim', avatarUrl: null };
const page = (items = [bob], nextCursor: string | null = null) => ({ ok: true, data: { items, nextCursor } });

const renderSheet = (type: 'followers' | 'following' = 'followers') =>
	render(<FollowersSheet username="alice" type={type} open onOpenChange={jest.fn()} />);

beforeEach(() => {
	jest.resetAllMocks();
	mockFollowers.mockResolvedValue(page());
	mockFollowing.mockResolvedValue(page());
});

it('does not fetch while closed', () => {
	render(<FollowersSheet username="alice" type="followers" open={false} onOpenChange={jest.fn()} />);
	expect(mockFollowers).not.toHaveBeenCalled();
});

it('fetches and shows followers when opened', async () => {
	renderSheet();
	expect(await screen.findByText('Bob Kim')).toBeInTheDocument();
	expect(mockFollowers).toHaveBeenCalledWith('alice');
});

it('lists whom the user follows for type "following"', async () => {
	renderSheet('following');
	await waitFor(() => expect(mockFollowing).toHaveBeenCalledWith('alice'));
});

it('shows the empty state', async () => {
	mockFollowers.mockResolvedValue(page([]));
	renderSheet();
	expect(await screen.findByText('No followers yet.')).toBeInTheDocument();
});

it('offers a retry when the list fails to load', async () => {
	mockFollowers.mockResolvedValueOnce({ ok: false, message: 'x' });
	renderSheet();
	expect(await screen.findByText('Couldn’t load this list.')).toBeInTheDocument();

	fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
	expect(await screen.findByText('Bob Kim')).toBeInTheDocument();
});

it('loads the next page with the cursor', async () => {
	mockFollowers
		.mockResolvedValueOnce(page([bob], 'c2'))
		.mockResolvedValueOnce(page([{ id: 'u2', username: 'cy', displayName: 'Cy', avatarUrl: null }]));
	renderSheet();
	await screen.findByText('Bob Kim');

	fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
	expect(await screen.findByText('Cy')).toBeInTheDocument();
	expect(mockFollowers).toHaveBeenLastCalledWith('alice', 'c2');
	expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
});
