import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
jest.mock('@/features/follows/service', () => ({
	followUser: (...a: unknown[]) => mockFollow(...a),
	unfollowUser: jest.fn(),
	getFollowers: jest.fn(),
	getFollowing: jest.fn(),
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
	isFollowing: false,
	isBlocked: false,
};

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
		render(<VisitorProfileView profile={visitor} polls={{ items: [], nextCursor: null }} isAuthenticated={false} />);

		expect(screen.getByRole('heading', { level: 1, name: 'Amira Haddad' })).toBeInTheDocument();
		expect(screen.getByText('Taipei')).toBeInTheDocument();
		expect(cell('polls asked')).toHaveTextContent('31');
		expect(cell('polls voted in')).toHaveTextContent('204');
		expect(screen.queryByText('people reached')).not.toBeInTheDocument();
		expect(screen.queryByRole('tab')).not.toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 2, name: 'Asked' })).toBeInTheDocument();
		expect(screen.getByText('No polls yet.')).toBeInTheDocument();
	});

	it('offers no Follow or followers lists when signed out', () => {
		render(<VisitorProfileView profile={visitor} polls={{ items: [], nextCursor: null }} isAuthenticated={false} />);

		expect(screen.queryByRole('button', { name: 'Follow' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Followers' })).not.toBeInTheDocument();
	});

	it('lets a signed-in visitor follow, and opens the people lists', () => {
		mockFollow.mockResolvedValue({ ok: true });
		render(<VisitorProfileView profile={visitor} polls={{ items: [], nextCursor: null }} isAuthenticated />);

		fireEvent.click(screen.getByRole('button', { name: 'Follow' }));
		expect(mockFollow).toHaveBeenCalledWith('u2');
		expect(screen.getByRole('button', { name: 'Following Unfollow', pressed: true })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Followers' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'More for @amira' })).toBeInTheDocument();
	});

	it('puts Follow back and says so when the request itself fails', async () => {
		mockFollow.mockRejectedValue(new Error('network'));
		render(<VisitorProfileView profile={visitor} polls={{ items: [], nextCursor: null }} isAuthenticated />);

		fireEvent.click(screen.getByRole('button', { name: 'Follow' }));
		expect(await screen.findByRole('button', { name: 'Follow' })).toBeEnabled();
		expect(toast.error).toHaveBeenCalled();
	});

	it('keeps them blocked and says so when unblocking fails', async () => {
		mockUnblock.mockRejectedValue(new Error('network'));
		render(
			<VisitorProfileView profile={{ ...visitor, isBlocked: true }} polls={{ items: [], nextCursor: null }} isAuthenticated />
		);

		fireEvent.click(screen.getByRole('button', { name: 'More for @amira' }));
		fireEvent.click(await screen.findByRole('menuitem', { name: 'Unblock' }));
		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		expect(mockUnblock).toHaveBeenCalledWith('u2');
		expect(mockRefresh).not.toHaveBeenCalled();
	});

	it('shows Blocked instead of Follow once the viewer blocked them', () => {
		render(
			<VisitorProfileView profile={{ ...visitor, isBlocked: true }} polls={{ items: [], nextCursor: null }} isAuthenticated />
		);

		expect(screen.getByText('Blocked')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Follow' })).not.toBeInTheDocument();
	});

	it('sections their polls into Open now and Ended, with what each decided', () => {
		const open = poll('o', { votingActive: true, endTime: '2099-01-01T00:00:00Z', options: [{ id: 'a', text: 'Yes' }] });
		const tie = poll('t', { options: [{ id: 'a', text: 'Yes', votes: 2 }, { id: 'b', text: 'Only in summer', votes: 2 }] });
		render(<VisitorProfileView profile={visitor} polls={{ items: [open, poll('e'), tie], nextCursor: null }} isAuthenticated={false} />);

		expect(screen.getByRole('heading', { level: 3, name: 'Open now · 1' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 3, name: 'Ended · 2' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Poll e/ })).toHaveTextContent('Yes won · 4 voted');
		expect(screen.getByRole('link', { name: /Poll t/ })).toHaveTextContent('Tie between Yes and Only in summer');

		fireEvent.click(screen.getByRole('button', { name: 'Open' }));
		expect(screen.queryByRole('link', { name: /Poll e/ })).not.toBeInTheDocument();
	});

	it("leaves section counts out while more pages remain", () => {
		render(<VisitorProfileView profile={visitor} polls={{ items: [poll('e')], nextCursor: 'c1' }} isAuthenticated={false} />);
		expect(screen.getByRole('heading', { level: 3, name: 'Ended' })).toBeInTheDocument();
	});

	it("tells a visitor the polls couldn't load rather than that there are none", () => {
		render(<VisitorProfileView profile={visitor} polls={null} isAuthenticated={false} />);
		expect(screen.getByText('Couldn’t load polls.')).toBeInTheDocument();
		expect(screen.queryByText('No polls yet.')).not.toBeInTheDocument();
	});

	it('previews the owner page without visitor controls', () => {
		render(<VisitorProfileView profile={visitor} polls={{ items: [], nextCursor: null }} isAuthenticated preview />);
		expect(screen.getByText('This is how others see your profile.')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Follow' })).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Back to your profile' })).toHaveAttribute('href', '/amira');
	});
});

describe('OwnProfileView', () => {
	const voted = poll('v', { creatorId: 'u9', creatorUsername: 'jt', myOptionId: 'a', unread: true });
	const sealed = poll('s', { creatorId: 'u9', votingActive: true, endTime: '2099-01-01T00:00:00Z', myOptionId: 'b', options: [{ id: 'a', text: 'Yes' }, { id: 'b', text: 'No' }] });
	const mine = poll('m', { participantCount: 40 });

	it('shows every field, marking hidden ones with the lock', () => {
		render(<OwnProfileView profile={me} polls={[]} />);

		expect(screen.getByRole('heading', { level: 1, name: 'Mei' })).toBeInTheDocument();
		// Location is hidden by default; points were made public
		expect(screen.getByText('Taipei')).toHaveTextContent('Taipei(Only you can see this)');
		expect(screen.getByText(/120 points/)).not.toHaveTextContent('Only you');
		expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
		expect(screen.getByRole('button', { name: 'Change avatar' })).toBeInTheDocument();
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
		expect(screen.getByText('Your polls show up here once they open.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Create a poll' })).toBeInTheDocument();
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
