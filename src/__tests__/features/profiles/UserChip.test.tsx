import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UserChip } from '@/features/profiles/UserChip';

jest.mock('next/link', () => {
	return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string }) {
		return (
			<a href={href} {...props}>
				{children}
			</a>
		);
	};
});
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockFollow = jest.fn();
jest.mock('@/features/follows/service', () => ({ followUser: (...a: unknown[]) => mockFollow(...a), unfollowUser: jest.fn() }));

const profile = {
	id: 'u1',
	username: 'mei',
	displayName: 'Mei Lin',
	bio: 'Asks about lunch',
	joinedAt: '2026-03-01T00:00:00Z',
	totalPolls: 3,
	totalVotes: 9,
	location: null,
	points: null,
	membershipLevel: null,
	avatarUrl: 'bot:bear',
	followersCount: 1204,
	followingCount: 86,
	// Signed out
	isFollowing: null,
	followsYou: null,
	isBlocked: null,
};

// jsdom has no Response; the card only reads ok, status and json()
const json = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
const fetchMock = jest.fn();

beforeEach(() => {
	fetchMock.mockReset();
	global.fetch = fetchMock;
});

describe('UserChip', () => {
	it('links the avatar and username to the profile as one', () => {
		render(<UserChip username="mei" avatarUrl="bot:bear" />);
		const link = screen.getByRole('link', { name: 'mei' });
		expect(link).toHaveAttribute('href', '/mei');
		expect(link.querySelector('img')).toHaveAttribute('src', '/avatars/bear.svg');
	});

	it('shows only the public profile fields on hover', async () => {
		fetchMock.mockResolvedValueOnce(json(profile));
		render(<UserChip username="mei" avatarUrl="bot:bear" />);
		await userEvent.hover(screen.getByRole('link', { name: 'mei' }));

		expect(await screen.findByText('Asks about lunch')).toBeInTheDocument();
		expect(screen.getByText('Mei Lin')).toBeInTheDocument();
		expect(screen.getByText('@mei')).toBeInTheDocument();
		// Location, points and membership are hidden (null), so only the join date is listed
		expect(screen.getByText(/^Joined /)).toBeInTheDocument();
		expect(screen.queryByText(/points/)).not.toBeInTheDocument();
		expect(fetchMock).toHaveBeenCalledWith('/api/profiles/mei');
	});

	it('counts their followers in the stats line, with no Follow signed out', async () => {
		fetchMock.mockResolvedValueOnce(json({ ...profile, username: 'ana' }));
		render(<UserChip username="ana" />);
		await userEvent.hover(screen.getByRole('link', { name: 'ana' }));

		expect(await screen.findByText('1,204')).toHaveClass('font-mono');
		expect(screen.getByText('1,204').parentElement).toHaveTextContent('1,204 followers');
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('offers Follow back to someone who follows the viewer, counting the follow at once', async () => {
		mockFollow.mockResolvedValue({ ok: true });
		fetchMock.mockResolvedValueOnce(json({ ...profile, username: 'jtan', isFollowing: false, followsYou: true, isBlocked: false }));
		render(<UserChip username="jtan" />);
		await userEvent.hover(screen.getByRole('link', { name: 'jtan' }));

		await userEvent.click(await screen.findByRole('button', { name: 'Follow back' }));
		expect(mockFollow).toHaveBeenCalledWith('u1');
		expect(screen.getByText('1,205').parentElement).toHaveTextContent('1,205 followers');
		await waitFor(() => expect(screen.getByRole('button', { name: 'Following Unfollow', pressed: true })).toBeEnabled());
	});

	it('puts the @handle under the name even without a display name', async () => {
		fetchMock.mockResolvedValueOnce(json({ ...profile, username: 'jo', displayName: null }));
		render(<UserChip username="jo" />);
		await userEvent.hover(screen.getByRole('link', { name: 'jo' }));
		expect(await screen.findByText('@jo')).toBeInTheDocument();
	});

	it('says so when the profile could not load', async () => {
		fetchMock.mockResolvedValueOnce(json(null, 500));
		render(<UserChip username="lin" />);
		await userEvent.hover(screen.getByRole('link', { name: 'lin' }));
		expect(await screen.findByText("Couldn’t load this profile.")).toBeInTheDocument();
	});

	it('keeps clicks in the card from reaching a link around it', async () => {
		fetchMock.mockResolvedValueOnce(json({ ...profile, username: 'kai' }));
		const onRowClick = jest.fn();
		render(
			<div onClick={onRowClick}>
				<UserChip username="kai" link={false} />
			</div>
		);
		await userEvent.hover(screen.getByText('kai'));
		await userEvent.click(await screen.findByText('Asks about lunch'));
		expect(onRowClick).not.toHaveBeenCalled();
	});

	it('shows no bot name tooltip on the avatar', async () => {
		render(<UserChip username="mei" avatarUrl="bot:bear" />);
		await userEvent.hover(screen.getByRole('link', { name: 'mei' }).querySelector('img')!);
		expect(screen.queryByText('Black Bear')).not.toBeInTheDocument();
	});
});
