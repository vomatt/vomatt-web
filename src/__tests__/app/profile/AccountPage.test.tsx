import { fireEvent, render, screen, within } from '@testing-library/react';

import AccountPage from '@/app/(frontend)/[slug]/_components/AccountPage';
import type { MyProfile, UserProfile } from '@/types/user';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: jest.fn(), refresh: mockRefresh }) }));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/lib/api/services/users', () => ({ editProfile: jest.fn() }));
jest.mock('@/features/polls/service', () => ({ getUserPolls: jest.fn() }));
jest.mock('@/features/blocks/service', () => ({ blockUserByUsername: jest.fn() }));
jest.mock('@/features/follows/service', () => ({ followUserByUsername: jest.fn() }));
jest.mock('@/features/avatars/service', () => ({ chooseAvatar: jest.fn() }));
jest.mock('@/features/groups/GroupsPanel', () => ({ GroupsPanel: () => <p>Groups panel</p> }));

const publicProfile: UserProfile = {
	username: 'mei',
	displayName: null,
	bio: null,
	joinedAt: '2026-08-01T10:00:00Z',
	totalPolls: 3,
	totalVotes: 12,
	location: 'Taipei',
	points: null,
	membershipLevel: null,
	avatarUrl: null,
};

const myProfile: MyProfile = {
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

const insights = { turnout: 40 };
const noPolls = { items: [], nextCursor: null };

/** Header items keep their words together with no-break spaces. */
const nb = (text: string) => text.replace(/ /g, '\u00a0');

/** The paragraph whose whole text matches, across its inline links and spans. */
const paragraph = (text: RegExp) =>
	screen.getByText((_, element) => element?.tagName === 'P' && text.test(element.textContent ?? ''));

/** The items of the header's details row holding `text`, in order; getByText reads no-break spaces as spaces. */
const rowOf = (text: string | RegExp) =>
	[...screen.getByText(text).parentElement!.children].map((item) => item.textContent);

/** The counts card's cell with this label. */
const stat = (label: string) => screen.getByText(label).closest('li');

describe('AccountPage', () => {
	it('shows a visitor the same header and stats, with only public fields', () => {
		render(
			<AccountPage
				isOwn={false}
				profile={publicProfile}
				polls={{ items: [], nextCursor: null }}
				isAuthenticated={false}
			/>
		);

		expect(screen.getByRole('heading', { level: 1, name: 'mei' })).toBeInTheDocument();
		expect(rowOf('Joined Aug 2026')).toEqual([nb('Taipei'), nb('Joined Aug 2026')]);
		expect(screen.queryByText(/points/)).not.toBeInTheDocument();
		expect(screen.queryByText(/Only you can see/)).not.toBeInTheDocument();
		expect(stat('Public polls voted in')).toHaveTextContent('12');
		expect(stat('Public polls created')).toHaveTextContent('3');
	});

	it('hides owner-only stats, tabs and actions from visitors', () => {
		render(
			<AccountPage
				isOwn={false}
				profile={publicProfile}
				polls={{ items: [], nextCursor: null }}
				isAuthenticated
			/>
		);

		expect(screen.queryByText('Votes received')).not.toBeInTheDocument();
		expect(screen.queryByRole('tab')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 2, name: 'Polls' })).toBeInTheDocument();
	});

	it('shows the owner every field, stat and tab', () => {
		render(<AccountPage isOwn profile={myProfile} polls={noPolls} insights={insights} />);

		expect(screen.getByRole('heading', { level: 1, name: 'Mei' })).toBeInTheDocument();
		expect(screen.getByText(/120 points/)).toBeInTheDocument();
		// Location is hidden from visitors: it leaves the details line for the owner's note
		expect(paragraph(/^Only you see: Taipei\. Change in Settings$/)).toBeInTheDocument();
		expect(rowOf('Joined Aug 2026')).toEqual([nb('120 points'), nb('Joined Aug 2026')]);
		const stats = within(stat('Public polls voted in')!.closest('ul')!).getAllByRole('listitem');
		expect(stats.map((item) => item.textContent)).toEqual([
			'12Public polls voted in',
			'3Public polls created',
			'40Votes received',
		]);
		expect(screen.queryByText(/majority/i)).not.toBeInTheDocument();
		expect(screen.getByRole('tab', { name: 'Polls' })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: 'Invite Lists' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
		expect(screen.queryByRole('tab', { name: 'Settings' })).not.toBeInTheDocument();
	});

	it('shows the owner their hidden display name and bio, marked, with a link to Settings', () => {
		const hidden = { ...myProfile, visibilitySettings: { displayName: false, bio: false } };
		render(<AccountPage isOwn profile={hidden} polls={noPolls} insights={insights} />);

		expect(screen.getByRole('heading', { level: 1, name: 'Mei (Only you can see this)' })).toBeInTheDocument();
		expect(screen.getByText(/Poll enthusiast/)).toHaveTextContent('Poll enthusiast(Only you can see this)');
		expect(paragraph(/^Only you see: Display\u00a0name, Bio, Taipei, and 120\u00a0points\. Change in Settings$/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Change in Settings' })).toHaveAttribute('href', '/settings');
	});

	it("lists a hidden membership level in the owner's note", () => {
		const hidden = { ...myProfile, membershipLevel: 'Gold', visibilitySettings: { points: true, membershipLevel: false } };
		render(<AccountPage isOwn profile={hidden} polls={noPolls} insights={insights} />);

		expect(paragraph(/^Only you see: Taipei and Gold\u00a0member\. Change in Settings$/)).toBeInTheDocument();
	});

	it('shows the display name and bio when the settings leave them out (public by default)', () => {
		render(<AccountPage isOwn profile={{ ...myProfile, visibilitySettings: {} }} polls={noPolls} insights={insights} />);

		expect(screen.getByRole('heading', { level: 1, name: 'Mei' })).toBeInTheDocument();
		// Exact text: no "only you" marker on either
		expect(screen.getByText('Poll enthusiast')).toBeInTheDocument();
	});

	it('groups large counts by locale', () => {
		render(<AccountPage isOwn profile={{ ...myProfile, totalVotes: 1200 }} polls={noPolls} insights={insights} />);

		expect(stat('Public polls voted in')).toHaveTextContent('1,200');
	});

	it("sends the owner's poll counts to My Polls, and keeps a visitor's static", () => {
		const { unmount } = render(<AccountPage isOwn profile={myProfile} polls={noPolls} insights={insights} />);
		expect(screen.getByRole('link', { name: '12 Public polls voted in' })).toHaveAttribute('href', '/my-polls');
		expect(screen.getByRole('link', { name: '3 Public polls created' })).toHaveAttribute('href', '/my-polls');
		expect(screen.queryByRole('link', { name: /Votes received/ })).not.toBeInTheDocument();
		unmount();

		render(<AccountPage isOwn={false} profile={publicProfile} polls={noPolls} isAuthenticated={false} />);
		expect(screen.queryByRole('link', { name: /Public polls voted in/ })).not.toBeInTheDocument();
	});

	it('lets the owner change their avatar from the header', () => {
		render(<AccountPage isOwn profile={myProfile} polls={noPolls} insights={insights} />);

		expect(screen.getByRole('button', { name: 'Change avatar' })).toBeInTheDocument();
	});

	it("says the owner's polls couldn't load, leaves out turnout, and retries", () => {
		render(<AccountPage isOwn profile={myProfile} polls={null} insights={null} />);

		expect(screen.getByText("Couldn’t load polls.")).toBeInTheDocument();
		expect(screen.queryByText('No polls yet.')).not.toBeInTheDocument();
		expect(screen.queryByText('Votes received')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		expect(mockRefresh).toHaveBeenCalled();
	});

	it("tells a visitor the polls couldn't load rather than that there are none", () => {
		render(<AccountPage isOwn={false} profile={publicProfile} polls={null} isAuthenticated={false} />);

		expect(screen.getByText("Couldn’t load polls.")).toBeInTheDocument();
		expect(screen.queryByText('No polls yet.')).not.toBeInTheDocument();
	});

	it('offers the owner the create action on an empty list, and not a visitor', () => {
		const { unmount } = render(<AccountPage isOwn profile={myProfile} polls={noPolls} insights={insights} />);
		expect(screen.getByText("Your polls show up here once they open.")).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Create a poll' })).toBeInTheDocument();
		unmount();

		render(<AccountPage isOwn={false} profile={publicProfile} polls={noPolls} isAuthenticated />);
		expect(screen.getByText('No polls yet.')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Create a poll' })).not.toBeInTheDocument();
	});

	it("doesn't let visitors change the avatar", () => {
		render(
			<AccountPage isOwn={false} profile={publicProfile} polls={{ items: [], nextCursor: null }} isAuthenticated />
		);

		expect(screen.queryByRole('button', { name: 'Change avatar' })).not.toBeInTheDocument();
	});
});
