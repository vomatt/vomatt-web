import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { StrictMode } from 'react';

import { dayGroup, NotificationList, NotificationSettingsLink } from '@/features/notifications/NotificationList';
import type { Notification } from '@/features/notifications/schema';

jest.mock('next/link', () => {
	return function MockLink({ children, href, onClick, ...rest }: React.ComponentProps<'a'> & { onClick?: () => void }) {
		return (
			<a href={href} {...rest} onClick={(e) => { e.preventDefault(); onClick?.(); }}>
				{children}
			</a>
		);
	};
});
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('@/features/polls/service', () => ({}));
const mockReadAll = jest.fn();
jest.mock('@/features/notifications/service', () => ({
	getNotifications: jest.fn(),
	readAllNotifications: (...a: unknown[]) => mockReadAll(...a),
}));
jest.mock('@/features/follows/service', () => ({ followUser: jest.fn().mockResolvedValue({ ok: true, data: undefined }) }));
jest.mock('@/features/follows/FollowListDialog', () => ({
	FollowListDialog: ({ username, list }: { username: string; list: string | null }) =>
		list && <div role="dialog">{`${list} of ${username}`}</div>,
}));
jest.mock('@/features/profiles/ProfileHoverCard', () => ({
	ProfileHoverCard: ({ children }: { children: React.ReactNode }) => children,
	rememberFollowing: jest.fn(),
}));
jest.mock('@/features/profiles/UserChip', () => ({ ProfileAvatar: () => null }));
const mockToastError = jest.fn();
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a) } }));
const mockRefresh = jest.fn();
let mockUnreadCount = 0;
jest.mock('@/features/notifications/UnreadCountProvider', () => ({
	useUnreadCount: () => ({ count: mockUnreadCount, isLoaded: true, refresh: mockRefresh }),
}));

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const NOW = new Date(2026, 9, 26, 15, 0);
const iso = (offset: number) => new Date(NOW.getTime() + offset).toISOString();
const person = (username: string, displayName: string | null = null) => ({
	id: `u-${username}`,
	username,
	displayName,
	avatarUrl: null,
	isFollowing: false,
	followsYou: false,
});

const result: Extract<Notification, { kind: 'RESULT' }> = {
	id: 'result_p1',
	kind: 'RESULT',
	createdAt: iso(-4 * HOUR),
	read: false,
	poll: {
		id: 'p1',
		title: 'Keep the library open until 22:00?',
		startTime: iso(-48 * HOUR),
		endTime: iso(-4 * HOUR),
		status: 'ENDED',
		turnout: 2061,
		myOptionId: 'a',
		winningOptionIds: ['a'],
		winningOptionLabels: ['Yes'],
		tie: false,
	},
};

const invitation: Extract<Notification, { kind: 'INVITATION' }> = {
	id: 'invitation_p2',
	kind: 'INVITATION',
	createdAt: iso(-6 * HOUR),
	read: false,
	actor: person('amira'),
	poll: {
		id: 'p2',
		title: 'Which stall should get the corner spot?',
		startTime: iso(-6 * HOUR),
		endTime: iso(48 * HOUR),
		status: 'OPEN',
		turnout: 12,
		myOptionId: null,
		winningOptionIds: null,
		winningOptionLabels: null,
		tie: null,
	},
};

const follow = (username: string, minutesAgo: number, overrides: Partial<Extract<Notification, { kind: 'FOLLOWED' }>> = {}): Notification => ({
	id: `follow_${username}`,
	kind: 'FOLLOWED',
	createdAt: iso(-minutesAgo * MINUTE),
	read: false,
	actor: { ...person(username), followsYou: true },
	...overrides,
});

const comment: Notification = {
	id: 'comment_c1',
	kind: 'COMMENT',
	createdAt: iso(-9 * HOUR),
	read: true,
	actor: person('rosa'),
	poll: { id: 'p3', title: 'Saturday market', startTime: iso(-48 * HOUR), endTime: iso(48 * HOUR), status: 'OPEN', turnout: 40 },
	comment: { id: 'c1', parentId: null, excerpt: 'The riverside has parking, the high street has foot traffic.' },
};

const closingSoon: Notification = {
	id: 'closing_p4',
	kind: 'CLOSING_SOON',
	createdAt: iso(-11 * HOUR),
	read: true,
	actor: person('kim'),
	poll: { id: 'p4', title: 'Bike lane on Minsheng Road', startTime: iso(-48 * HOUR), endTime: iso(6 * HOUR), status: 'OPEN', turnout: 342 },
};

const cancelled: Notification = {
	id: 'cancelled_p5',
	kind: 'CANCELLED',
	createdAt: iso(-10 * HOUR),
	read: true,
	actor: person('rosa'),
	poll: { id: 'p5', title: 'Night bus on Sundays?', startTime: iso(-10 * HOUR), endTime: iso(-10 * HOUR), status: 'ENDED', turnout: 0 },
};

const renderList = (items: Notification[], unreadIds: string[] | null = null) =>
	render(<NotificationList initialPage={{ items, nextCursor: null }} unreadIds={unreadIds} viewerUsername="mei" />);
const rowOf = (text: string) => screen.getByText(text, { exact: false }).closest('li')!;

beforeEach(() => {
	jest.clearAllMocks();
	jest.useFakeTimers({ now: NOW, advanceTimers: true });
	mockUnreadCount = 0;
	mockReadAll.mockResolvedValue({ ok: true, data: undefined });
});
afterEach(() => jest.useRealTimers());

describe('dayGroup()', () => {
	const now = new Date(2026, 9, 25, 15, 0);
	it('reads today, yesterday and earlier from the local calendar', () => {
		expect(dayGroup(new Date(2026, 9, 25, 0, 5).toISOString(), now)).toBe('today');
		expect(dayGroup(new Date(2026, 9, 24, 23, 59).toISOString(), now)).toBe('yesterday');
		expect(dayGroup(new Date(2026, 9, 23, 12, 0).toISOString(), now)).toBe('earlier');
	});
});

describe('NotificationList rows', () => {
	it('says a result is in, with the outcome and the viewer\'s pick', () => {
		renderList([result]);
		const row = rowOf('Keep the library');
		expect(row).toHaveTextContent('Results are in · Keep the library open until 22:00?');
		expect(row).toHaveTextContent('Yes won · 2,061 voted · 4h');
		expect(row).toHaveTextContent('Your pick won');
	});

	it('names every option that shares the most votes, and says the viewer\'s pick tied', () => {
		renderList([{ ...result, poll: { ...result.poll, winningOptionIds: ['a', 'b'], winningOptionLabels: ['Yes', 'No'], tie: true } }]);
		const row = rowOf('Keep the library');
		expect(row).toHaveTextContent('Tie between Yes and No · 2,061 voted');
		expect(row).toHaveTextContent('Tied for first');
	});

	it('gives read rows a soft fill and keeps unread ones a card', () => {
		renderList([invitation, closingSoon]);
		expect(rowOf('Which stall')).toHaveClass('bg-card');
		expect(rowOf('Which stall')).not.toHaveClass('bg-surface-soft');
		expect(rowOf('Bike lane on Minsheng')).toHaveClass('bg-surface-soft');
	});

	it('says the pick lost, and leaves the outcome out when no Ballot named an option', () => {
		renderList([
			{ ...result, poll: { ...result.poll, myOptionId: 'b' } },
			{ ...result, id: 'result_p9', poll: { ...result.poll, id: 'p9', title: 'Nobody came', turnout: 0, myOptionId: null, winningOptionIds: [], winningOptionLabels: [] } },
		]);
		expect(rowOf('Keep the library')).toHaveTextContent('Outvoted');
		const empty = rowOf('Nobody came');
		expect(empty).toHaveTextContent('0 voted · 4h');
		expect(empty).not.toHaveTextContent(/won|Tie|Outvoted/);
	});

	it('offers the vote on an invitation', () => {
		renderList([invitation]);
		const row = rowOf('Which stall');
		expect(row).toHaveTextContent('@amira invited you · Which stall should get the corner spot?');
		expect(row).toHaveTextContent('Invite only · ends Wed 15:00 · 6h');
		expect(within(row).getByRole('link', { name: 'Vote' })).toHaveAttribute('href', '/poll/p2');
	});

	it('offers Follow back to a new follower, or shows Following once followed back', () => {
		renderList([
			follow('jtan', 120, { actor: { ...person('jtan', 'Jun Tan'), followsYou: true } }),
			comment,
			follow('tpark', 600, { read: true, actor: { ...person('tpark'), isFollowing: true, followsYou: true } }),
		]);
		const jtan = rowOf('@jtan');
		expect(jtan).toHaveTextContent('@jtan followed you');
		expect(jtan).toHaveTextContent('2h · Jun Tan');
		expect(within(jtan).getByRole('button', { name: 'Follow back' })).toBeInTheDocument();
		expect(within(rowOf('@tpark')).getByRole('button', { name: /Following/ })).toHaveAttribute('aria-haspopup', 'dialog');
	});

	it('quotes a comment and replies under it on the poll page', () => {
		renderList([comment]);
		const row = rowOf('Saturday market');
		expect(row).toHaveTextContent('@rosa made the case under Saturday market');
		expect(row).toHaveTextContent('“The riverside has parking, the high street has foot traffic.” · 9h');
		expect(within(row).getByRole('link', { name: 'Reply' })).toHaveAttribute('href', '/poll/p3#reply-c1');
	});

	it('words a reply as one and links it under the comment it answers', () => {
		renderList([{ ...comment, comment: { ...comment.comment, id: 'r7', parentId: 'c1' } }]);
		const row = rowOf('Saturday market');
		expect(row).toHaveTextContent('@rosa replied in Saturday market');
		expect(within(row).getByRole('link', { name: 'Saturday market' })).toHaveAttribute('href', '/poll/p3#comment-c1/r7');
		expect(within(row).getByRole('link', { name: 'Reply' })).toHaveAttribute('href', '/poll/p3#reply-c1/r7');
	});

	it('offers View on an invitation the viewer already voted in, or one not open yet', () => {
		renderList([
			{ ...invitation, poll: { ...invitation.poll, myOptionId: 'a' } },
			{ ...invitation, id: 'invitation_p6', poll: { ...invitation.poll, id: 'p6', title: 'Later', startTime: iso(24 * HOUR), status: 'SCHEDULED' } },
		]);
		expect(within(rowOf('Which stall')).getByRole('link', { name: 'View' })).toBeInTheDocument();
		const later = rowOf('Later');
		expect(later).toHaveTextContent('Invite only · Opens tomorrow at 15:00 · 6h');
		expect(within(later).getByRole('link', { name: 'View' })).toBeInTheDocument();
	});

	it('nudges a poll closing soon with the turnout alone', () => {
		renderList([closingSoon]);
		const row = rowOf('Bike lane');
		expect(row).toHaveTextContent('Bike lane on Minsheng Road ends in 6h');
		expect(row).toHaveTextContent('You haven’t voted · 342 voted so far · 11h');
		expect(within(row).getByRole('link', { name: 'Vote' })).toHaveAttribute('href', '/poll/p4');
	});

	it('words a mention and links to the comment', () => {
		renderList([{ ...comment, id: 'mention_c1', kind: 'MENTION', read: false }]);
		const row = rowOf('Saturday market');
		expect(row).toHaveTextContent('@rosa mentioned you in Saturday market');
		expect(within(row).getByRole('link', { name: 'Reply' })).toHaveAttribute('href', '/poll/p3#reply-c1');
	});

	it('words a like and links to the liked comment', () => {
		renderList([{ ...comment, id: 'like_c1', kind: 'LIKE', read: false }]);
		const row = rowOf('Saturday market');
		expect(row).toHaveTextContent('@rosa liked your comment in Saturday market');
		expect(within(row).getByRole('link', { name: 'Reply' })).toHaveAttribute('href', '/poll/p3#reply-c1');
	});

	it('words a cancelled poll without an action', () => {
		renderList([cancelled]);
		const row = rowOf('Night bus');
		expect(row).toHaveTextContent('Night bus on Sundays? was cancelled by @rosa');
		expect(within(row).queryByRole('button')).not.toBeInTheDocument();
		expect(within(row).getAllByRole('link')).toHaveLength(1);
	});

	it('marks only unread rows with a dot', () => {
		renderList([result, comment]);
		expect(within(rowOf('Keep the library')).getByText('Unread')).toBeInTheDocument();
		expect(within(rowOf('Saturday market')).queryByText('Unread')).not.toBeInTheDocument();
	});
});

describe('NotificationList follows', () => {
	it('folds consecutive follows into one row that opens the followers list', () => {
		renderList([follow('bkim', 10), follow('jtan', 20), follow('tpark', 30), result, follow('rosa', 300)]);

		const group = rowOf('@bkim');
		expect(group).toHaveTextContent('@bkim and 2 others followed you');
		expect(screen.queryByText('@jtan')).not.toBeInTheDocument();
		// A follow after another kind starts its own row
		expect(rowOf('@rosa')).toHaveTextContent('@rosa followed you');

		fireEvent.click(within(group).getByRole('button', { name: 'See followers' }));
		expect(screen.getByRole('dialog')).toHaveTextContent('followers of mei');
	});

	it('says "1 other" for a pair', () => {
		renderList([follow('bkim', 10), follow('jtan', 20)]);
		expect(rowOf('@bkim')).toHaveTextContent('@bkim and 1 other followed you');
	});
});

describe('NotificationList read state', () => {
	it('reads everything once on opening, then recounts the badge', async () => {
		let respond!: (result: unknown) => void;
		mockReadAll.mockReturnValueOnce(new Promise((resolve) => (respond = resolve)));
		const { rerender } = render(
			<StrictMode>
				<NotificationList initialPage={{ items: [invitation, result], nextCursor: null }} unreadIds={null} viewerUsername="mei" />
			</StrictMode>
		);
		expect(mockReadAll).toHaveBeenCalledTimes(1);
		expect(mockRefresh).not.toHaveBeenCalled();
		await act(async () => respond({ ok: true, data: undefined }));
		expect(mockRefresh).toHaveBeenCalledTimes(1);

		// A fresh server page doesn't read again
		rerender(
			<StrictMode>
				<NotificationList initialPage={{ items: [invitation], nextCursor: null }} unreadIds={[]} viewerUsername="mei" />
			</StrictMode>
		);
		await act(() => jest.advanceTimersByTimeAsync(0));
		expect(mockReadAll).toHaveBeenCalledTimes(1);
	});

	it('keeps the dot on what was unread before this visit read it, across tabs', async () => {
		const { getNotifications } = jest.requireMock('@/features/notifications/service');
		const like = { ...comment, id: 'like_c1', kind: 'LIKE', read: true, poll: { ...comment.poll, title: 'Liked poll' } };
		getNotifications.mockResolvedValueOnce({ items: [like, { ...comment, id: 'like_c2', kind: 'LIKE', read: true }], nextCursor: null });
		renderList([{ ...invitation, read: true }, comment], ['invitation_p2', 'like_c1']);
		expect(within(rowOf('Which stall')).getByText('Unread')).toBeInTheDocument();
		expect(within(rowOf('Saturday market')).queryByText('Unread')).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Likes' }));
		expect(await screen.findByText('Liked poll', { exact: false })).toBeInTheDocument();
		expect(within(rowOf('Liked poll')).getByText('Unread')).toBeInTheDocument();
		expect(within(rowOf('Saturday market')).queryByText('Unread')).not.toBeInTheDocument();
	});

	it('still reads everything when the unread ids could not be loaded, with dots from the page itself', async () => {
		renderList([invitation, comment], null);
		await waitFor(() => expect(mockReadAll).toHaveBeenCalledTimes(1));
		expect(within(rowOf('Which stall')).getByText('Unread')).toBeInTheDocument();
		expect(within(rowOf('Saturday market')).queryByText('Unread')).not.toBeInTheDocument();
	});

	it('reads nothing when the feed could not be loaded', async () => {
		render(<NotificationList initialPage={null} unreadIds={['invitation_p2']} viewerUsername="mei" />);
		await act(() => jest.advanceTimersByTimeAsync(0));
		expect(mockReadAll).not.toHaveBeenCalled();
	});

	it('marks a group of follows unread when any follow in it was', () => {
		renderList([follow('bkim', 10, { read: true }), follow('jtan', 20, { read: true })], ['follow_jtan']);
		expect(within(rowOf('@bkim')).getByText('Unread')).toBeInTheDocument();
	});

	it('opens the row\'s target from anywhere on the row', () => {
		renderList([invitation]);
		const cover = rowOf('Which stall').querySelector('a[aria-hidden="true"]')!;
		expect(cover).toHaveAttribute('href', '/poll/p2');
		expect(cover).toHaveAttribute('tabindex', '-1');
	});

	it('opens the followers list from anywhere on a group of follows', () => {
		renderList([follow('bkim', 10), follow('jtan', 20)]);
		fireEvent.click(rowOf('@bkim').querySelector('button[aria-hidden="true"]')!);
		expect(screen.getByRole('dialog')).toHaveTextContent('followers of mei');
	});

	it('follows back from the row', async () => {
		renderList([follow('jtan', 10)]);
		fireEvent.click(screen.getByRole('button', { name: 'Follow back' }));
		expect(await screen.findByRole('button', { name: /Following/ })).toBeInTheDocument();
	});
});

describe('NotificationList', () => {
	it('groups by day, newest first', () => {
		renderList([follow('jtan', 60), { ...comment, createdAt: iso(-20 * HOUR) }, { ...result, createdAt: iso(-72 * HOUR) }]);
		expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Today', 'Yesterday', 'Earlier']);
		expect(screen.getByRole('region', { name: 'Earlier' })).toHaveTextContent('Results are in');
	});

	it('loads a category tab and keeps its category while paging', async () => {
		const { getNotifications } = jest.requireMock('@/features/notifications/service');
		const like = { ...comment, id: 'like_c1', kind: 'LIKE' };
		getNotifications.mockResolvedValueOnce({ items: [like], nextCursor: 'n1' }).mockResolvedValueOnce({ items: [], nextCursor: null });
		renderList([result, comment]);

		fireEvent.click(screen.getByRole('button', { name: 'Likes' }));
		await waitFor(() => expect(getNotifications).toHaveBeenCalledWith(null, 'LIKE'));
		expect(await screen.findByText(/liked your comment/)).toBeInTheDocument();
		expect(screen.queryByText('Results are in', { exact: false })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Likes' })).toHaveAttribute('aria-pressed', 'true');

		fireEvent.click(screen.getByRole('button', { name: /Load more/ }));
		await waitFor(() => expect(getNotifications).toHaveBeenCalledWith('n1', 'LIKE'));
	});

	it('says so when a category tab is empty, and keeps the tabs', async () => {
		const { getNotifications } = jest.requireMock('@/features/notifications/service');
		getNotifications.mockResolvedValueOnce({ items: [], nextCursor: null });
		renderList([result]);
		fireEvent.click(screen.getByRole('button', { name: 'Follows' }));
		expect(await screen.findByText('Nothing here yet.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Follows' })).toBeInTheDocument();
	});

	it('stays on the current tab and says so when a category fails to load', async () => {
		const { getNotifications } = jest.requireMock('@/features/notifications/service');
		getNotifications.mockRejectedValueOnce(new Error('down'));
		renderList([result]);
		fireEvent.click(screen.getByRole('button', { name: 'Likes' }));
		await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Couldn’t load that tab. Try again.'));
		expect(screen.getByRole('button', { name: 'Likes' })).toHaveAttribute('aria-pressed', 'false');
		expect(screen.getByText('Results are in', { exact: false })).toBeInTheDocument();
	});

	it('shows the empty state only when there is nothing at all, and keeps the tabs', () => {
		renderList([]);
		expect(screen.getByRole('heading', { level: 1, name: 'Notifications' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 2, name: 'No notifications yet.' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Follows' })).toBeInTheDocument();
	});

	it('writes the tab into the address, and opens on the one it names', async () => {
		const { getNotifications } = jest.requireMock('@/features/notifications/service');
		getNotifications.mockResolvedValueOnce({ items: [], nextCursor: null });
		renderList([result]);
		fireEvent.click(screen.getByRole('button', { name: 'Follows' }));
		await waitFor(() => expect(window.location.search).toBe('?tab=follow'));
		cleanup();

		render(<NotificationList initialPage={{ items: [], nextCursor: 'n1' }} initialCategory="LIKE" unreadIds={null} viewerUsername="mei" />);
		expect(screen.getByRole('button', { name: 'Likes' })).toHaveAttribute('aria-pressed', 'true');
		fireEvent.click(screen.getByRole('button', { name: /Load more/ }));
		await waitFor(() => expect(getNotifications).toHaveBeenCalledWith('n1', 'LIKE'));
		window.history.replaceState(null, '', '/');
	});

	it('leaves the address alone when a notification was opened while the tab loaded', async () => {
		const { getNotifications } = jest.requireMock('@/features/notifications/service');
		let respond!: (page: unknown) => void;
		getNotifications.mockReturnValueOnce(new Promise((resolve) => (respond = resolve)));
		window.history.replaceState(null, '', '/notifications');
		renderList([result]);
		fireEvent.click(screen.getByRole('button', { name: 'Follows' }));
		window.history.pushState(null, '', '/poll/p3');
		respond({ items: [], nextCursor: null });
		await waitFor(() => expect(screen.getByRole('button', { name: 'Follows' })).toHaveAttribute('aria-pressed', 'true'));
		expect(window.location.pathname + window.location.search).toBe('/poll/p3');
		window.history.replaceState(null, '', '/');
	});

	it('keeps address parameters that are not the tab', async () => {
		const { getNotifications } = jest.requireMock('@/features/notifications/service');
		getNotifications.mockResolvedValue({ items: [], nextCursor: null });
		window.history.replaceState(null, '', '/notifications?utm_source=mail');
		renderList([result]);
		fireEvent.click(screen.getByRole('button', { name: 'Follows' }));
		await waitFor(() => expect(window.location.search).toBe('?utm_source=mail&tab=follow'));
		fireEvent.click(screen.getByRole('button', { name: 'All' }));
		await waitFor(() => expect(window.location.search).toBe('?utm_source=mail'));
		window.history.replaceState(null, '', '/');
	});

	it('offers no read-all or unread filter', () => {
		renderList([invitation, comment]);
		expect(screen.queryByRole('button', { name: 'Mark all read' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Unread/ })).not.toBeInTheDocument();
	});

	it('says when the feed could not be loaded', () => {
		render(<NotificationList initialPage={null} unreadIds={null} viewerUsername="mei" />);
		expect(screen.getByText('Couldn’t load notifications.')).toBeInTheDocument();
	});
});

describe('NotificationSettingsLink', () => {
	it('sums up the switches and links to them in Settings', () => {
		render(<NotificationSettingsLink preferences={{ resultsIn: true, invitations: true, comments: true, mentions: true, likes: true, closingSoon: false }} />);
		const link = screen.getByRole('link', { name: /Notification settings/ });
		expect(link).toHaveAttribute('href', '/settings#notifications');
		expect(link).toHaveTextContent('Results, invitations, comments, mentions, likes on · closing soon off');
	});

	it('names only what is on, or only what is off', () => {
		const { rerender } = render(
			<NotificationSettingsLink preferences={{ resultsIn: true, invitations: true, comments: true, mentions: true, likes: true, closingSoon: true }} />
		);
		expect(screen.getByRole('link')).toHaveTextContent('Results, invitations, comments, mentions, likes, closing soon on');
		rerender(<NotificationSettingsLink preferences={{ resultsIn: false, invitations: false, comments: false, mentions: false, likes: false, closingSoon: false }} />);
		expect(screen.getByRole('link')).toHaveTextContent('Results, invitations, comments, mentions, likes, closing soon off');
	});

	it('leaves the summary out when the switches could not be loaded', () => {
		render(<NotificationSettingsLink preferences={null} />);
		expect(screen.getByRole('link')).toHaveTextContent(/^Notification settings$/);
	});
});
