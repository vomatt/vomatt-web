import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProfileName, UserChip } from '@/features/profiles/UserChip';

jest.mock('next/link', () => {
	return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string }) {
		return (
			<a href={href} {...props}>
				{children}
			</a>
		);
	};
});
// jsdom can't leave the page, but it does follow a hash-only URL, so the login URL lands in the hash
jest.mock('@/lib/routes', () => {
	const actual = jest.requireActual('@/lib/routes');
	return { ...actual, loginHref: (options: object) => `#${actual.loginHref(options)}` };
});
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
let mockMe: { username: string } | null = null;
jest.mock('@/features/communities/ActingProvider', () => ({
	...jest.requireActual('@/features/communities/ActingProvider'),
	useActing: () => ({ acting: null, me: mockMe, communities: [], stale: false }),
}));
const mockFollow = jest.fn();
const mockUnfollow = jest.fn();
const mockGetMutualFollowers = jest.fn();
jest.mock('@/features/follows/service', () => ({
	followUser: (...a: unknown[]) => mockFollow(...a),
	unfollowUser: (...a: unknown[]) => mockUnfollow(...a),
	getMutualFollowers: (...a: unknown[]) => mockGetMutualFollowers(...a),
}));

const profile = {
	id: 'u1',
	username: 'mei',
	displayName: 'Mei Lin',
	bio: 'Asks about lunch',
	joinedAt: '2026-03-01T00:00:00Z',
	totalPolls: 3,
	totalVotes: 9,
	location: null,
	avatarUrl: 'bot:bear',
	followersCount: 1204,
	followingCount: 86,
	// Signed out
	isFollowing: null,
	followsYou: null,
	isBlocked: null,
	mutualFollowersCount: null,
	mutualFollowersPreview: null,
};

// jsdom has no Response; the card only reads ok, status and json()
const json = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
const fetchMock = jest.fn();

beforeEach(() => {
	mockMe = { username: 'viewer' };
	fetchMock.mockReset();
	mockUnfollow.mockClear();
	mockFollow.mockClear();
	sessionStorage.clear();
	global.fetch = fetchMock;
});

describe('UserChip', () => {
	it('links the avatar and username to the profile as one', () => {
		render(<UserChip username="mei" avatarUrl="bot:bear" />);
		const link = screen.getByRole('link', { name: '@mei' });
		expect(link).toHaveAttribute('href', '/mei');
		expect(link.querySelector('img')).toHaveAttribute('src', '/avatars/bear.svg');
	});

	it('links the names in the card to the profile', async () => {
		fetchMock.mockResolvedValueOnce(json({ ...profile, username: 'ruth', displayName: 'Ruth Wu' }));
		render(<UserChip username="ruth" link={false} />);
		await userEvent.hover(screen.getByText('@ruth'));
		expect(await screen.findByRole('link', { name: 'Ruth Wu @ruth' })).toHaveAttribute('href', '/ruth');
	});

	it('offers a signed-out visitor Follow in the card, through log in and back to the same page', async () => {
		mockMe = null;
		window.history.pushState(null, '', '/?tag=food#feed');
		fetchMock.mockResolvedValueOnce(json({ ...profile, username: 'otto' }));
		render(<UserChip username="otto" />);
		await userEvent.hover(screen.getByRole('link', { name: '@otto' }));
		await userEvent.click(await screen.findByRole('button', { name: 'Follow' }));
		expect(sessionStorage.getItem('vomatt:pending-follow')).toBe('u1');
		expect(window.location.hash).toBe('#/login?redirect=%2F%3Ftag%3Dfood%23feed');
		expect(mockFollow).not.toHaveBeenCalled();
	});

	it('names a comment author by username', () => {
		render(<ProfileName username="ruby" />);
		expect(screen.getByRole('link', { name: '@ruby' })).toHaveAttribute('href', '/ruby');
	});

	it('shows no community badge, inline or in the card', async () => {
		fetchMock.mockResolvedValueOnce(json({ ...profile, username: 'council', community: true }));
		render(<UserChip username="council" />);
		await userEvent.hover(screen.getByRole('link', { name: '@council' }));
		expect(await screen.findByText('Asks about lunch')).toBeInTheDocument();
		expect(screen.queryByRole('img', { name: 'Community account' })).not.toBeInTheDocument();
	});

	it('shows only the public profile fields on hover', async () => {
		fetchMock.mockResolvedValueOnce(json(profile));
		render(<UserChip username="mei" avatarUrl="bot:bear" />);
		await userEvent.hover(screen.getByRole('link', { name: '@mei' }));

		expect(await screen.findByText('Asks about lunch')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Mei Lin @mei' })).toHaveAttribute('href', '/mei');
		// Location, points and membership are hidden (null), so only the join date is listed
		expect(screen.getByText(/^Joined /)).toBeInTheDocument();
		expect(screen.queryByText(/points/)).not.toBeInTheDocument();
		expect(fetchMock).toHaveBeenCalledWith('/api/profiles/mei');
	});

	it('closes the card once a scroll carries the chip away, so it never rides over the sticky bars', async () => {
		fetchMock.mockResolvedValueOnce(json(profile));
		render(<UserChip username="mei" avatarUrl="bot:bear" />);
		const chip = screen.getByRole('link', { name: '@mei' });
		await userEvent.hover(chip);
		expect(await screen.findByText('Asks about lunch')).toBeInTheDocument();

		window.dispatchEvent(new Event('scroll'));
		expect(screen.getByText('Asks about lunch')).toBeInTheDocument();

		chip.getBoundingClientRect = () => ({ top: -120, left: 0 }) as DOMRect;
		window.dispatchEvent(new Event('scroll'));
		await waitFor(() => expect(screen.queryByText('Asks about lunch')).not.toBeInTheDocument());
	});

	it('leads with the real name on hover, then the display name, as the profile does', async () => {
		fetchMock.mockResolvedValueOnce(json({ ...profile, username: 'ruby', firstName: 'Ruby', lastName: 'Ho', displayName: 'rubes' }));
		render(<UserChip username="ruby" />);
		await userEvent.hover(screen.getByRole('link', { name: '@ruby' }));

		expect(await screen.findByText('Ruby Ho')).toHaveTextContent('Ruby Ho rubes');
	});

	it('counts their followers in the stats line', async () => {
		fetchMock.mockResolvedValueOnce(json({ ...profile, username: 'ana' }));
		render(<UserChip username="ana" />);
		await userEvent.hover(screen.getByRole('link', { name: '@ana' }));

		expect(await screen.findByText('1,204')).toHaveClass('tabular-nums');
		expect(screen.getByText('1,204').parentElement).toHaveTextContent('1,204 followers');
	});

	it('offers Follow back to someone who follows the viewer, counting the follow at once', async () => {
		mockFollow.mockResolvedValue({ ok: true });
		fetchMock.mockResolvedValueOnce(json({ ...profile, username: 'jtan', isFollowing: false, followsYou: true, isBlocked: false }));
		render(<UserChip username="jtan" />);
		await userEvent.hover(screen.getByRole('link', { name: '@jtan' }));

		await userEvent.click(await screen.findByRole('button', { name: 'Follow back' }));
		expect(mockFollow).toHaveBeenCalledWith('u1');
		expect(screen.getByText('1,205').parentElement).toHaveTextContent('1,205 followers');
		await waitFor(() => expect(screen.getByRole('button', { name: 'Following' })).toBeEnabled());
	});

	it('asks before unfollowing from the card', async () => {
		mockUnfollow.mockResolvedValue({ ok: true });
		fetchMock.mockResolvedValueOnce(json({ ...profile, username: 'jtan', isFollowing: true, followsYou: false, isBlocked: false }));
		render(<UserChip username="jtan" />);
		await userEvent.hover(screen.getByRole('link', { name: '@jtan' }));

		await userEvent.click(await screen.findByRole('button', { name: 'Following' }));
		expect(mockUnfollow).not.toHaveBeenCalled();
		const confirm = await screen.findByRole('alertdialog', { name: 'Unfollow @jtan?' });
		await userEvent.click(within(confirm).getByRole('button', { name: 'Unfollow' }));
		expect(mockUnfollow).toHaveBeenCalledWith('u1');
	});

	it('hands focus back to the chip when the confirm is cancelled from the card', async () => {
		fetchMock.mockResolvedValueOnce(json({ ...profile, username: 'kai', isFollowing: true, followsYou: false, isBlocked: false }));
		render(<UserChip username="kai" />);
		await userEvent.hover(screen.getByRole('link', { name: '@kai' }));

		await userEvent.click(await screen.findByRole('button', { name: 'Following' }));
		await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
		expect(screen.getByRole('link', { name: '@kai' })).toHaveFocus();
		expect(mockUnfollow).not.toHaveBeenCalled();
	});

	it('says who the viewer follows among their followers, opening that list', async () => {
		const jtan = { id: 'u3', username: 'jtan', displayName: 'Jun Tan', avatarUrl: null };
		mockGetMutualFollowers.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
		fetchMock.mockResolvedValueOnce(
			json({ ...profile, username: 'amira', isFollowing: false, mutualFollowersCount: 1, mutualFollowersPreview: [jtan] })
		);
		const onRowClick = jest.fn();
		render(
			<div onClick={onRowClick}>
				<UserChip username="amira" />
			</div>
		);
		await userEvent.hover(screen.getByRole('link', { name: '@amira' }));

		await userEvent.click(await screen.findByRole('button', { name: 'Followed by @jtan' }));
		expect(await screen.findByRole('dialog', { name: 'Followers you know' })).toBeInTheDocument();
		expect(mockGetMutualFollowers).toHaveBeenCalledWith('amira');
		await userEvent.click(await screen.findByText('No one you follow follows them yet.'));
		expect(onRowClick).not.toHaveBeenCalled();
	});

	it('names no followers in common signed out', async () => {
		fetchMock.mockResolvedValueOnce(json({ ...profile, username: 'noa' }));
		render(<UserChip username="noa" />);
		await userEvent.hover(screen.getByRole('link', { name: '@noa' }));
		expect(await screen.findByText('Asks about lunch')).toBeInTheDocument();
		expect(screen.queryByText(/^Followed by/)).not.toBeInTheDocument();
	});

	it('puts the @handle under the name even without a display name', async () => {
		fetchMock.mockResolvedValueOnce(json({ ...profile, username: 'jo', displayName: null }));
		render(<UserChip username="jo" />);
		await userEvent.hover(screen.getByRole('link', { name: '@jo' }));
		expect(await screen.findByRole('link', { name: 'jo @jo' })).toHaveAttribute('href', '/jo');
	});

	it('says so when the profile could not load', async () => {
		fetchMock.mockResolvedValueOnce(json(null, 500));
		render(<UserChip username="lin" />);
		await userEvent.hover(screen.getByRole('link', { name: '@lin' }));
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
		await userEvent.hover(screen.getByText('@kai'));
		await userEvent.click(await screen.findByText('Asks about lunch'));
		expect(onRowClick).not.toHaveBeenCalled();
	});

	it('shows no bot name tooltip on the avatar', async () => {
		render(<UserChip username="mei" avatarUrl="bot:bear" />);
		await userEvent.hover(screen.getByRole('link', { name: '@mei' }).querySelector('img')!);
		expect(screen.queryByText('Black Bear')).not.toBeInTheDocument();
	});
});
