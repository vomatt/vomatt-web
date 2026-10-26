import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { dayGroup, NotificationList, pollOutcome, toRows } from '@/features/notifications/NotificationList';
import type { Notification, NotificationPoll } from '@/features/notifications/schema';

jest.mock('next/link', () => {
	return function MockLink({ children, href, onClick, className }: { children: React.ReactNode; href: string; onClick?: () => void; className?: string }) {
		return (
			<a href={href} className={className} onClick={(e) => { e.preventDefault(); onClick?.(); }}>
				{children}
			</a>
		);
	};
});
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockMarkRead = jest.fn();
const mockMarkAll = jest.fn();
jest.mock('@/features/notifications/service', () => ({
	markNotificationRead: (...a: unknown[]) => mockMarkRead(...a),
	markAllNotificationsRead: (...a: unknown[]) => mockMarkAll(...a),
	getNotifications: jest.fn(),
	getUnreadCount: jest.fn(),
}));
const mockToastError = jest.fn();
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a) } }));
const mockRefresh = jest.fn();
jest.mock('@/features/notifications/UnreadCountProvider', () => ({
	useUnreadCount: () => ({ count: 0, isLoaded: true, refresh: mockRefresh }),
}));
jest.mock('@/features/profiles/UserChip', () => ({ ProfileAvatar: () => null }));
jest.mock('@/features/follows/FollowButton', () => ({
	FollowButton: ({ userId, initialFollowing }: { userId: string; initialFollowing: boolean }) => (
		<button>{initialFollowing ? `Following ${userId}` : `Follow ${userId}`}</button>
	),
}));

const HOUR = 3600_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();

const bob = { id: 'user-2', username: 'bob', displayName: null, avatarUrl: null, isFollowing: false, followsYou: true };

const poll: NotificationPoll = {
	id: 'poll-1',
	title: 'Where should the book club meet?',
	startTime: iso(-HOUR),
	endTime: iso(48 * HOUR),
	status: 'OPEN',
	turnout: 4,
};

const invitation: Notification = {
	id: 'invitation_poll-1',
	kind: 'INVITATION',
	createdAt: iso(-HOUR),
	read: false,
	actor: bob,
	poll,
};

const result: Notification = {
	id: 'result_poll-2',
	kind: 'RESULT',
	createdAt: iso(-72 * HOUR),
	read: true,
	actor: null,
	poll: {
		...poll,
		id: 'poll-2',
		title: 'Tabs or spaces?',
		status: 'ENDED',
		myOptionId: 'a',
		winningOptionIds: ['a'],
		winningOptionLabels: ['Tabs'],
		tie: false,
	},
};

const followed = (id: string, username: string, createdAt = iso(-2 * HOUR)): Notification => ({
	id,
	kind: 'FOLLOWED',
	createdAt,
	read: false,
	actor: { ...bob, id: `user-${username}`, username },
	poll: null,
});

const page = (...items: Notification[]) => ({ items, nextCursor: null });

beforeEach(() => jest.clearAllMocks());

describe('dayGroup()', () => {
	const now = new Date(2026, 9, 25, 15, 0);
	it('reads today, yesterday and earlier from the local calendar', () => {
		expect(dayGroup(new Date(2026, 9, 25, 0, 5).toISOString(), now)).toBe('today');
		expect(dayGroup(new Date(2026, 9, 24, 23, 59).toISOString(), now)).toBe('yesterday');
		expect(dayGroup(new Date(2026, 9, 23, 12, 0).toISOString(), now)).toBe('earlier');
	});
});

describe('pollOutcome()', () => {
	const ended: NotificationPoll = { ...poll, status: 'ENDED', myOptionId: 'a', winningOptionIds: ['a'] };
	it('says whether the viewer’s pick won, tied or lost', () => {
		expect(pollOutcome(ended)).toBe('won');
		expect(pollOutcome({ ...ended, tie: true })).toBe('tied');
		expect(pollOutcome({ ...ended, winningOptionIds: ['b'] })).toBe('lost');
	});
	it('has nothing to say without a Ballot, winners or an Ended Poll', () => {
		expect(pollOutcome({ ...ended, myOptionId: null })).toBe('unknown');
		expect(pollOutcome({ ...ended, winningOptionIds: [] })).toBe('unknown');
		expect(pollOutcome({ ...ended, status: 'OPEN' })).toBe('unknown');
	});
});

describe('toRows()', () => {
	it('folds follows into one row at the first follow', () => {
		const rows = toRows([followed('f1', 'amy'), invitation, followed('f2', 'cat')]);
		expect(rows.map((row) => row.items.map((item) => item.id))).toEqual([['f1', 'f2'], [invitation.id]]);
	});
});

describe('NotificationList', () => {
	it('lists the feed in order, grouped by day', () => {
		render(<NotificationList initialPage={page(invitation, result)} />);

		expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Today', 'Earlier']);
		const today = screen.getByRole('region', { name: 'Today' });
		expect(within(today).getByRole('listitem')).toHaveTextContent('@bob invited you · Where should the book club meet?');
		const earlier = screen.getByRole('region', { name: 'Earlier' });
		expect(within(earlier).getByRole('listitem')).toHaveTextContent('Results are in · Tabs or spaces?');
		expect(within(earlier).getByRole('listitem')).toHaveTextContent('Tabs won · 4 voted');
		expect(within(earlier).getByRole('listitem')).toHaveTextContent('Your pick won');
	});

	it('clears a row’s unread dot when it is opened, and reads it on the server', () => {
		mockMarkRead.mockResolvedValue(undefined);
		render(<NotificationList initialPage={page(invitation)} />);
		expect(screen.getByRole('button', { name: /Unread 1/ })).toBeInTheDocument();
		fireEvent.click(screen.getByText(poll.title));
		expect(screen.getByRole('button', { name: /Unread 0/ })).toBeInTheDocument();
		expect(mockMarkRead).toHaveBeenCalledWith(invitation.id);
	});

	it('filters to unread, and says when everything is read', () => {
		render(<NotificationList initialPage={page(result)} />);
		fireEvent.click(screen.getByRole('button', { name: /Unread/ }));
		expect(screen.getByText('You’re all caught up.')).toBeInTheDocument();
	});

	it('marks everything read in one request', async () => {
		mockMarkAll.mockResolvedValue({ ok: true, data: undefined });
		render(<NotificationList initialPage={page(invitation, followed('f1', 'amy'))} />);

		fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));
		await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
		expect(mockMarkAll).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('button', { name: /Unread 0/ })).toBeInTheDocument();
		expect(mockToastError).not.toHaveBeenCalled();
	});

	it('keeps the dots, and says so, when marking all read fails', async () => {
		mockMarkAll.mockResolvedValue({ ok: false, message: 'nope' });
		render(<NotificationList initialPage={page(invitation)} />);

		fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));
		await waitFor(() => expect(mockToastError).toHaveBeenCalled());
		expect(screen.getByRole('button', { name: /Unread 1/ })).toBeInTheDocument();
	});

	it('words a cancelled poll without an action', () => {
		const cancelled: Notification = {
			...result,
			id: 'cancelled_poll-3',
			kind: 'CANCELLED',
			actor: bob,
			poll: { ...result.poll!, title: 'Night bus?', winningOptionIds: [], winningOptionLabels: [] },
		};
		render(<NotificationList initialPage={page(cancelled)} />);
		const row = screen.getByRole('listitem');
		expect(row).toHaveTextContent('Night bus? was cancelled by @bob');
		expect(row).toHaveTextContent('Your vote was never counted');
	});

	it('offers Follow back on a single follower', () => {
		render(<NotificationList initialPage={page(followed('f1', 'amy'))} />);
		const row = screen.getByRole('listitem');
		expect(row).toHaveTextContent('@amy followed you');
		expect(within(row).getByRole('button', { name: 'Follow user-amy' })).toBeInTheDocument();
	});

	it('folds several followers into one row without a button', () => {
		render(<NotificationList initialPage={page(followed('f1', 'amy'), followed('f2', 'cat'), followed('f3', 'dan'))} />);
		const row = screen.getByRole('listitem');
		expect(row).toHaveTextContent('@amy and 2 others followed you');
		expect(within(row).queryByRole('button')).not.toBeInTheDocument();
	});

	it('links a reply to its comment', () => {
		const reply: Notification = {
			id: 'comment_c2',
			kind: 'COMMENT',
			createdAt: iso(-HOUR),
			read: true,
			actor: bob,
			poll,
			comment: { id: 'c2', parentId: 'c1', excerpt: 'Fair point' },
		};
		render(<NotificationList initialPage={page(reply)} />);
		const row = screen.getByRole('listitem');
		expect(row).toHaveTextContent('@bob replied on Where should the book club meet?');
		expect(row).toHaveTextContent('“Fair point”');
		expect(within(row).getByRole('link')).toHaveAttribute('href', '/poll/poll-1#comment-c1/c2');
	});

	it('shows the empty state only when there is nothing at all', () => {
		render(<NotificationList initialPage={page()} />);
		expect(screen.getByText('No notifications yet.')).toBeInTheDocument();
	});

	it('says when the feed could not be loaded', () => {
		render(<NotificationList initialPage={null} />);
		expect(screen.getByText('Couldn’t load notifications.')).toBeInTheDocument();
	});
});
