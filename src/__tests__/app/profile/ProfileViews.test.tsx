import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

import { OwnProfileView } from '@/app/(frontend)/[slug]/_components/OwnProfileView';
import { VisitorProfileView } from '@/app/(frontend)/[slug]/_components/VisitorProfileView';
import type { Poll } from '@/features/polls/schema';
import type { MyProfile, UserProfile } from '@/types/user';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: jest.fn(), refresh: mockRefresh }) }));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/lib/api/services/users', () => ({ editProfile: jest.fn(), updateVisibility: jest.fn() }));
jest.mock('@/features/polls/service', () => ({ getUserPolls: jest.fn() }));
const mockUnblock = jest.fn();
jest.mock('@/features/blocks/service', () => ({ blockUser: jest.fn(), unblockUser: (...a: unknown[]) => mockUnblock(...a) }));
const mockFollow = jest.fn();
const mockUnfollow = jest.fn();
const mockGetFollowers = jest.fn();
const mockGetMutualFollowers = jest.fn();
jest.mock('@/features/follows/service', () => ({
	followUser: (...a: unknown[]) => mockFollow(...a),
	unfollowUser: (...a: unknown[]) => mockUnfollow(...a),
	getFollowers: (...a: unknown[]) => mockGetFollowers(...a),
	getFollowing: jest.fn(),
	getMutualFollowers: (...a: unknown[]) => mockGetMutualFollowers(...a),
}));
jest.mock('@/features/avatars/service', () => ({ chooseAvatar: jest.fn() }));
jest.mock('@/features/notifications/service', () => ({}));
const visitor: UserProfile = {
	id: 'u2',
	username: 'amira',
	displayName: 'Amira Haddad',
	bio: null,
	joinedAt: '2026-08-01T10:00:00Z',
	totalPolls: 31,
	totalVotes: 204,
	location: 'Taipei',
	points: null,
	membershipLevel: null,
	avatarUrl: null,
	followersCount: 1204,
	followingCount: 86,
	isFollowing: false,
	followsYou: false,
	isBlocked: false,
	mutualFollowersCount: 0,
	mutualFollowersPreview: [],
};

const jtan = { id: 'u3', username: 'jtan', displayName: 'Jun Tan', avatarUrl: null };
const rosa = { id: 'u4', username: 'rosa', displayName: null, avatarUrl: null };
const withMutuals: UserProfile = { ...visitor, mutualFollowersCount: 3, mutualFollowersPreview: [jtan, rosa] };

const me: MyProfile = {
	id: 'u1',
	username: 'mei',
	email: 'mei@example.com',
	phoneNumber: null,
	firstName: null,
	lastName: null,
	birthday: null,
	displayName: 'Mei',
	bio: 'Poll enthusiast',
	location: 'Taipei',
	points: 120,
	membershipLevel: null,
	active: true,
	lastLoginAt: null,
	joinedAt: '2026-08-01T10:00:00Z',
	totalPolls: 3,
	totalVotes: 12,
	followersCount: 128,
	followingCount: 42,
	visibilitySettings: { points: true },
	avatarUrl: 'bot:boba',
	anonymousBallotByDefault: false,
};

function poll(id: string, overrides: Partial<Poll> = {}): Poll {
	return {
		id,
		title: `Poll ${id}`,
		active: true,
		votingActive: false,
		creatorId: 'u1',
		creatorUsername: 'mei',
		createdAt: '2026-01-01T00:00:00Z',
		startTime: '2026-01-01T00:00:00Z',
		endTime: '2026-01-02T00:00:00Z',
		options: [
			{ id: 'a', text: 'Yes', votes: 3 },
			{ id: 'b', text: 'No', votes: 1 },
		],
		totalVotes: 4,
		participantCount: 4,
		...overrides,
	};
}

const cell = (label: string) => screen.getByText(label).closest('div');

describe('VisitorProfileView', () => {
	beforeEach(() => jest.clearAllMocks());

	it('shows public fields, the public record and their Asked list only', () => {
		render(<VisitorProfileView profile={visitor} polls={{ items: [], nextCursor: null }} viewerId={null} />);

		expect(screen.getByRole('heading', { level: 1, name: 'Amira Haddad' })).toBeInTheDocument();
		expect(screen.queryByText('Taipei')).not.toBeInTheDocument();
		expect(cell('polls asked')).toHaveTextContent('31');
		expect(cell('polls voted in')).toHaveTextContent('204');
		expect(screen.queryByText('people reached')).not.toBeInTheDocument();
		expect(screen.queryByRole('tab')).not.toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 2, name: 'Asked 31' })).toBeInTheDocument();
		expect(screen.getByText('No polls yet.')).toBeInTheDocument();
	});

	it('leads with the real name the owner made public, then the display name', () => {
		render(
			<VisitorProfileView
				profile={{ ...visitor, firstName: 'Amira', lastName: 'Haddad', displayName: 'Ami' }}
				polls={{ items: [], nextCursor: null }}
				viewerId={null}
			/>
		);
		expect(screen.getByRole('heading', { level: 1, name: 'Amira Haddad Ami' })).toBeInTheDocument();
	});

	it('says what following does, even signed out', () => {
		render(<VisitorProfileView profile={visitor} polls={{ items: [], nextCursor: null }} viewerId={null} />);
		expect(screen.getByText('What following does')).toBeInTheDocument();
	});

	it('offers no Follow when signed out, and shows the counts without opening the lists', () => {
		render(<VisitorProfileView profile={visitor} polls={{ items: [], nextCursor: null }} viewerId={null} />);

		expect(screen.queryByRole('button', { name: 'Follow' })).not.toBeInTheDocument();
		expect(screen.getByText('1,204').parentElement).toHaveTextContent('1,204 followers');
		expect(screen.getByText('86').parentElement).toHaveTextContent('86 following');
		expect(screen.queryByRole('button', { name: /followers|following/ })).not.toBeInTheDocument();
	});

	it('sets the counts in mono under the handle, each opening its list', async () => {
		mockGetFollowers.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
		render(<VisitorProfileView profile={visitor} polls={{ items: [], nextCursor: null }} viewerId="u1" />);

		expect(screen.getByText('1,204')).toHaveClass('tabular-nums');
		expect(screen.getByRole('button', { name: '86 following' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: '1,204 followers' }));
		expect(await screen.findByRole('dialog', { name: 'Followers' })).toBeInTheDocument();
		expect(mockGetFollowers).toHaveBeenCalledWith('amira');
	});

	it('lets a signed-in visitor follow, counting them among the followers at once', () => {
		mockFollow.mockReturnValue(new Promise(() => {}));
		render(<VisitorProfileView profile={visitor} polls={{ items: [], nextCursor: null }} viewerId="u1" />);

		fireEvent.click(screen.getByRole('button', { name: 'Follow' }));
		expect(mockFollow).toHaveBeenCalledWith('u2');
		expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '1,205 followers' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'More for @amira' })).toBeInTheDocument();
	});

	it('puts Follow and the count back and says so when the request itself fails', async () => {
		mockFollow.mockRejectedValue(new Error('network'));
		render(<VisitorProfileView profile={visitor} polls={{ items: [], nextCursor: null }} viewerId="u1" />);

		fireEvent.click(screen.getByRole('button', { name: 'Follow' }));
		expect(await screen.findByRole('button', { name: 'Follow' })).toBeEnabled();
		expect(screen.getByRole('button', { name: '1,204 followers' })).toBeInTheDocument();
		expect(toast.error).toHaveBeenCalled();
	});

	it('offers Follow back to someone who follows the viewer, and again after unfollowing', async () => {
		mockFollow.mockResolvedValue({ ok: true });
		mockUnfollow.mockResolvedValue({ ok: true });
		render(
			<VisitorProfileView profile={{ ...visitor, followsYou: true }} polls={{ items: [], nextCursor: null }} viewerId="u1" />
		);

		fireEvent.click(screen.getByRole('button', { name: 'Follow back' }));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Following' })).toBeEnabled());
		expect(screen.getByRole('button', { name: '1,205 followers' })).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Following' }));
		expect(mockUnfollow).not.toHaveBeenCalled();
		const confirm = await screen.findByRole('alertdialog', { name: 'Unfollow @amira?' });
		fireEvent.click(within(confirm).getByRole('button', { name: 'Unfollow' }));
		expect(mockUnfollow).toHaveBeenCalledWith('u2');
		await waitFor(() => expect(screen.getByRole('button', { name: 'Follow back' })).toBeEnabled());
		expect(screen.getByRole('button', { name: '1,204 followers' })).toBeInTheDocument();
	});

	it('keeps following when the unfollow confirm is cancelled', async () => {
		render(<VisitorProfileView profile={{ ...visitor, isFollowing: true }} polls={{ items: [], nextCursor: null }} viewerId="u1" />);

		fireEvent.click(screen.getByRole('button', { name: 'Following' }));
		const confirm = await screen.findByRole('alertdialog', { name: 'Unfollow @amira?' });
		fireEvent.click(within(confirm).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
		expect(mockUnfollow).not.toHaveBeenCalled();
		expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument();
	});

	it('keeps them blocked and says so when unblocking fails', async () => {
		mockUnblock.mockRejectedValue(new Error('network'));
		render(
			<VisitorProfileView profile={{ ...visitor, isBlocked: true }} polls={{ items: [], nextCursor: null }} viewerId="u1" />
		);

		fireEvent.click(screen.getByRole('button', { name: 'More for @amira' }));
		fireEvent.click(await screen.findByRole('menuitem', { name: 'Unblock' }));
		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		expect(mockUnblock).toHaveBeenCalledWith('u2');
		expect(mockRefresh).not.toHaveBeenCalled();
	});

	it('shows Blocked instead of Follow once the viewer blocked them', () => {
		render(
			<VisitorProfileView profile={{ ...visitor, isBlocked: true }} polls={{ items: [], nextCursor: null }} viewerId="u1" />
		);

		expect(screen.getByText('Blocked')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Follow' })).not.toBeInTheDocument();
	});

	it('sections their polls into Open now and Ended, with what each decided', () => {
		const open = poll('o', { votingActive: true, endTime: '2099-01-01T00:00:00Z', options: [{ id: 'a', text: 'Yes' }] });
		const tie = poll('t', { options: [{ id: 'a', text: 'Yes', votes: 2 }, { id: 'b', text: 'Only in summer', votes: 2 }] });
		render(<VisitorProfileView profile={visitor} polls={{ items: [open, poll('e'), tie], nextCursor: null }} viewerId={null} />);

		expect(screen.getByRole('heading', { level: 3, name: 'Open now · 1' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 3, name: 'Ended · 2' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Poll e/ })).toHaveTextContent('Yes won · 4 voted');
		expect(screen.getByRole('link', { name: /Poll t/ })).toHaveTextContent('Tie between Yes and Only in summer');

		fireEvent.click(screen.getByRole('button', { name: 'Open' }));
		expect(screen.queryByRole('link', { name: /Poll e/ })).not.toBeInTheDocument();
	});

	it('puts each open poll\'s time in its meta, beside a status-word chip', () => {
		// Jest runs in Asia/Taipei (jest.config.ts): Wednesday 28 October 2026, 10:00
		jest.useFakeTimers({ now: Date.parse('2026-10-28T10:00:00+08:00') });
		const started = '2026-10-20T01:00:00Z';
		const open = poll('o', { votingActive: true, startTime: started, endTime: '2026-10-30T20:00:00+08:00', participantCount: 1284 });
		const closing = poll('c', { votingActive: true, startTime: started, endTime: '2026-10-28T16:00:00+08:00', participantCount: 342 });
		const soon = poll('s', { votingActive: true, startTime: '2026-11-02T09:00:00+08:00', endTime: null });
		render(<VisitorProfileView profile={visitor} polls={{ items: [open, closing, soon], nextCursor: null }} viewerId={null} />);
		jest.useRealTimers();

		expect(screen.getByRole('link', { name: /Poll o/ })).toHaveTextContent(/1,284 voted · ends Fri 20:00\s*Open$/);
		expect(screen.getByRole('link', { name: /Poll c/ })).toHaveTextContent(/342 voted · ends in 6h\s*Closing$/);
		expect(screen.getByRole('link', { name: /Poll s/ })).toHaveTextContent(/Opens Mon 9:00\s*Soon$/);
	});

	it("leaves section counts out while more pages remain", () => {
		render(<VisitorProfileView profile={visitor} polls={{ items: [poll('e')], nextCursor: 'c1' }} viewerId={null} />);
		expect(screen.getByRole('heading', { level: 3, name: 'Ended' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
	});

	it("tells a visitor the polls couldn't load rather than that there are none", () => {
		render(<VisitorProfileView profile={visitor} polls={null} viewerId={null} />);
		expect(screen.getByText('Couldn’t load polls.')).toBeInTheDocument();
		expect(screen.queryByText('No polls yet.')).not.toBeInTheDocument();
	});

	it('says who the viewer follows among their followers, opening that list', async () => {
		mockGetMutualFollowers.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
		render(<VisitorProfileView profile={withMutuals} polls={{ items: [], nextCursor: null }} viewerId="u1" />);

		fireEvent.click(screen.getByRole('button', { name: 'Followed by @jtan and 2 others you follow' }));
		expect(await screen.findByRole('dialog', { name: 'Followers you know' })).toBeInTheDocument();
		expect(mockGetMutualFollowers).toHaveBeenCalledWith('amira');
	});

	it('lists those people in the rail, each linking to their profile, then all their followers', async () => {
		mockGetFollowers.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
		render(<VisitorProfileView profile={withMutuals} polls={{ items: [], nextCursor: null }} viewerId="u1" />);

		const card = screen.getByRole('region', { name: 'Followers you know' });
		expect(within(card).getByRole('link', { name: 'Jun Tan @jtan' })).toHaveAttribute('href', '/jtan');
		expect(within(card).getByRole('link', { name: 'rosa @rosa' })).toHaveAttribute('href', '/rosa');
		fireEvent.click(within(card).getByRole('button', { name: 'All 1,204 followers' }));
		expect(await screen.findByRole('dialog', { name: 'Followers' })).toBeInTheDocument();
	});

	it.each([
		['signed out', { mutualFollowersCount: null, mutualFollowersPreview: null }],
		['with no one in common', { mutualFollowersCount: 0, mutualFollowersPreview: [] }],
	])('shows no followers in common %s', (_, mutuals) => {
		render(<VisitorProfileView profile={{ ...visitor, ...mutuals }} polls={{ items: [], nextCursor: null }} viewerId="u1" />);
		expect(screen.queryByText(/^Followed by/)).not.toBeInTheDocument();
		expect(screen.queryByRole('region', { name: 'Followers you know' })).not.toBeInTheDocument();
	});

	it('previews the owner page without visitor controls', () => {
		render(<VisitorProfileView profile={visitor} polls={{ items: [], nextCursor: null }} viewerId="u2" preview />);
		expect(screen.getByText('This is how others see your profile.')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Follow' })).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Back to your profile' })).toHaveAttribute('href', '/amira');
		expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument();
		expect(screen.queryByText('What following does')).not.toBeInTheDocument();
	});
});

describe('OwnProfileView', () => {
	const voted = poll('v', { creatorId: 'u9', creatorUsername: 'jt', myOptionId: 'a', unread: true });
	const sealed = poll('s', { creatorId: 'u9', votingActive: true, endTime: '2099-01-01T00:00:00Z', myOptionId: 'b', options: [{ id: 'a', text: 'Yes' }, { id: 'b', text: 'No' }] });
	const mine = poll('m', { participantCount: 40 });

	it('shows the owner their hidden real name with the lock, and keeps it out of the public preview', () => {
		render(<OwnProfileView profile={{ ...me, firstName: 'Mei', lastName: 'Lin' }} polls={[]} />);
		expect(screen.getByRole('heading', { level: 1, name: 'Mei Lin (Only you can see this) Mei' })).toBeInTheDocument();
		expect(screen.getByRole('region', { name: 'What everyone sees' })).not.toHaveTextContent('Mei Lin');
	});

	it('leaves out location and points, even ones made public', () => {
		render(<OwnProfileView profile={me} polls={[]} />);

		expect(screen.getByRole('heading', { level: 1, name: 'Mei' })).toBeInTheDocument();
		expect(screen.queryByText('Taipei')).not.toBeInTheDocument();
		expect(screen.queryByText(/120 points/)).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
		expect(screen.getByRole('button', { name: 'Change avatar' })).toBeInTheDocument();
	});

	it('counts who they follow under the handle, and keeps it in step with Follow back in their lists', async () => {
		const jtan = { id: 'u3', username: 'jtan', displayName: 'Jun Tan', avatarUrl: null, isFollowing: false, followsYou: true };
		mockGetFollowers.mockResolvedValue({ ok: true, data: { items: [jtan], nextCursor: null } });
		mockFollow.mockResolvedValue({ ok: true });
		render(<OwnProfileView profile={me} polls={[]} />);

		expect(screen.getByRole('button', { name: '42 following' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: '128 followers' }));
		fireEvent.click(await screen.findByRole('button', { name: 'Follow back' }));
		expect(mockFollow).toHaveBeenCalledWith('u3');
		expect(screen.getByRole('button', { name: '43 following', hidden: true })).toBeInTheDocument();
	});

	it('puts their following count back when a Follow back from the list fails', async () => {
		const jtan = { id: 'u3', username: 'jtan', displayName: 'Jun Tan', avatarUrl: null, isFollowing: false, followsYou: true };
		mockGetFollowers.mockResolvedValue({ ok: true, data: { items: [jtan], nextCursor: null } });
		mockFollow.mockResolvedValue({ ok: false, message: 'Request failed' });
		render(<OwnProfileView profile={me} polls={[]} />);

		fireEvent.click(screen.getByRole('button', { name: '128 followers' }));
		fireEvent.click(await screen.findByRole('button', { name: 'Follow back' }));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Follow back' })).toBeEnabled());
		expect(screen.getByRole('button', { name: '42 following', hidden: true })).toBeInTheDocument();
		expect(toast.error).toHaveBeenCalled();
	});

	it('adds the private record: people reached and picks that won', () => {
		render(<OwnProfileView profile={me} polls={[mine, voted]} />);

		expect(cell('people reached')).toHaveTextContent('40');
		expect(cell('picks that won')).toHaveTextContent('100%');
		expect(cell('picks that won')).toHaveTextContent('Only you can see this');
	});

	it('lists asked polls with the owner menu, and voted ones with the pick and outcome', () => {
		render(<OwnProfileView profile={me} polls={[mine, voted, sealed]} />);

		const askedRow = screen.getByRole('link', { name: /Poll m/ }).closest('li')!;
		expect(within(askedRow).getByRole('button', { name: 'More actions for Poll m' })).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /Poll v/ })).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('tab', { name: /Voted/ }));
		expect(screen.getByRole('heading', { level: 3, name: 'Sealed, waiting for results · 1' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Poll s/ })).toHaveTextContent('You chose No');
		const decided = screen.getByRole('link', { name: /Poll v/ });
		expect(decided).toHaveTextContent('You chose Yes · 4 voted · new');
		expect(decided).toHaveTextContent('Your pick won');
	});

	it('says when a sealed ballot\'s results come, in the viewer\'s words for the day', () => {
		// Jest runs in Asia/Taipei (jest.config.ts): Wednesday 28 October 2026, 10:00
		jest.useFakeTimers({ now: Date.parse('2026-10-28T10:00:00+08:00') });
		const today = { ...sealed, id: 't', title: 'Poll t', endTime: '2026-10-28T18:00:00+08:00' };
		const friday = { ...sealed, id: 'f', title: 'Poll f', endTime: '2026-10-30T20:00:00+08:00' };
		render(<OwnProfileView profile={me} polls={[today, friday]} initialTab="voted" />);
		jest.useRealTimers();

		expect(screen.getByRole('link', { name: /Poll t/ })).toHaveTextContent('You chose No · results today at 18:00');
		expect(screen.getByRole('link', { name: /Poll f/ })).toHaveTextContent('You chose No · results Fri 20:00');
	});

	it('keeps every owner control in the row menu of an open invite-only poll', async () => {
		const invited = poll('i', { votingActive: true, endTime: '2099-01-01T00:00:00Z', audience: 'invite-only' });
		render(<OwnProfileView profile={me} polls={[invited]} />);

		await userEvent.click(screen.getByRole('button', { name: 'More actions for Poll i' }));
		const items = (await screen.findAllByRole('menuitem')).map((item) => item.textContent);
		expect(items).toEqual(['End poll now…', 'Invitees', 'Share']);
	});

	it('puts the unread dot right after the title, not at either edge of the row', () => {
		render(<OwnProfileView profile={me} polls={[{ ...mine, unread: true, endTime: '2020-01-01T00:00:00Z' }, voted]} />);
		const askedTitle = screen.getByText('Poll m');
		expect(askedTitle.previousElementSibling).toBeNull();
		expect(askedTitle.nextElementSibling).toHaveTextContent('Unread');

		fireEvent.click(screen.getByRole('tab', { name: /Voted/ }));
		const votedTitle = screen.getByText('Poll v');
		expect(votedTitle.previousElementSibling).toBeNull();
		expect(votedTitle.nextElementSibling).toHaveTextContent('Unread');
	});

	it('counts unread results on the Voted tab', () => {
		render(<OwnProfileView profile={me} polls={[voted]} />);
		expect(screen.getByRole('tab', { name: /Voted/ })).toHaveTextContent('1 Unread');
	});

	it('opens on the Voted tab when asked to', () => {
		render(<OwnProfileView profile={me} polls={[voted]} initialTab="voted" />);
		expect(screen.getByRole('tab', { name: /Voted/, selected: true })).toBeInTheDocument();
		expect(screen.getByText('Your ballots are yours')).toBeInTheDocument();
	});

	it('offers the create action on an empty Asked list', () => {
		render(<OwnProfileView profile={me} polls={[]} />);
		expect(screen.getByRole('heading', { level: 2, name: 'No polls yet.' })).toBeInTheDocument();
		expect(screen.getByText('Your polls show up here once they open.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Create a poll' })).toHaveAttribute('aria-haspopup', 'dialog');
	});

	it('shows what everyone sees only beside the lists, from xl', () => {
		render(<OwnProfileView profile={me} polls={[]} />);
		expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
		// jsdom has no layout, so the class that hides the preview below xl stands in for it
		expect(screen.getByRole('region', { name: 'What everyone sees' })).toHaveClass('max-xl:hidden');
	});

	it("says the polls couldn't load, and retries", () => {
		render(<OwnProfileView profile={me} polls={null} />);
		expect(cell('people reached')).toHaveTextContent('–');
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		expect(mockRefresh).toHaveBeenCalled();
	});

	it('links to the public view of the page', () => {
		render(<OwnProfileView profile={me} polls={[]} />);
		expect(screen.getByRole('link', { name: 'Open your public page' })).toHaveAttribute('href', '/mei?view=public');
	});
});
