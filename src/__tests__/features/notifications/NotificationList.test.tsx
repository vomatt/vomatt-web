import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { dayGroup, NotificationList, NotificationSettingsLink } from '@/features/notifications/NotificationList';
import { SEEN_MS } from '@/features/notifications/NotificationRows';
import type { Notification } from '@/features/notifications/schema';
import { READ_BATCH_MS, READ_MAX_WAIT_MS } from '@/features/notifications/useMarkRead';

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
const mockMarkRead = jest.fn();
jest.mock('@/features/notifications/service', () => ({
	getNotifications: jest.fn(),
	markNotificationsRead: (...a: unknown[]) => mockMarkRead(...a),
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

// Rows report seen only when a test scrolls them into view
let observed: { callback: IntersectionObserverCallback; elements: Element[] }[] = [];
global.IntersectionObserver = class {
	entry: (typeof observed)[number];
	constructor(callback: IntersectionObserverCallback) {
		this.entry = { callback, elements: [] };
		observed.push(this.entry);
	}
	observe(element: Element) {
		this.entry.elements.push(element);
	}
	disconnect() {
		observed = observed.filter((entry) => entry !== this.entry);
	}
} as unknown as typeof IntersectionObserver;
/** Reports the row at each ratio in turn, in one observer callback as a browser batches them. */
const scrollIntoView = (row: Element, ...ratios: number[]) =>
	act(() => {
		const entries = (ratios.length ? ratios : [1]).map((intersectionRatio) => ({ target: row, isIntersecting: intersectionRatio > 0, intersectionRatio }));
		for (const { callback } of observed.filter(({ elements }) => elements.includes(row))) {
			callback(entries as unknown as IntersectionObserverEntry[], {} as IntersectionObserver);
		}
	});
/** Every id sent to be read, across requests. */
const readIds = () => mockMarkRead.mock.calls.flatMap(([ids]) => ids).sort();

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

const renderList = (items: Notification[]) =>
	render(<NotificationList initialPage={{ items, nextCursor: null }} viewerUsername="mei" />);
const rowOf = (text: string) => screen.getByText(text, { exact: false }).closest('li')!;

beforeEach(() => {
	jest.clearAllMocks();
	observed = [];
	jest.useFakeTimers({ now: NOW, advanceTimers: true });
	mockUnreadCount = 0;
	mockMarkRead.mockResolvedValue({ ok: true, data: [] });
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
		expect(within(row).getByRole('link', { name: 'Reply' })).toHaveAttribute('href', '/poll/p3#comment-c1');
	});

	it('links a reply under the comment it answers', () => {
		renderList([{ ...comment, comment: { ...comment.comment, id: 'r7', parentId: 'c1' } }]);
		expect(within(rowOf('Saturday market')).getByRole('link', { name: 'Reply' })).toHaveAttribute('href', '/poll/p3#comment-c1/r7');
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
		expect(within(row).getByRole('link', { name: 'Reply' })).toHaveAttribute('href', '/poll/p3#comment-c1');
	});

	it('words a like and links to the liked comment', () => {
		renderList([{ ...comment, id: 'like_c1', kind: 'LIKE', read: false }]);
		const row = rowOf('Saturday market');
		expect(row).toHaveTextContent('@rosa liked your comment in Saturday market');
		expect(within(row).getByRole('link', { name: 'Reply' })).toHaveAttribute('href', '/poll/p3#comment-c1');
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
	it('folds consecutive follows into one row that opens the followers list', async () => {
		renderList([follow('bkim', 10), follow('jtan', 20), follow('tpark', 30), result, follow('rosa', 300)]);

		const group = rowOf('@bkim');
		expect(group).toHaveTextContent('@bkim and 2 others followed you');
		expect(screen.queryByText('@jtan')).not.toBeInTheDocument();
		// A follow after another kind starts its own row
		expect(rowOf('@rosa')).toHaveTextContent('@rosa followed you');

		fireEvent.click(within(group).getByRole('button', { name: 'See followers' }));
		expect(screen.getByRole('dialog')).toHaveTextContent('followers of mei');
		await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
		expect(readIds()).toEqual(['follow_bkim', 'follow_jtan', 'follow_tpark']);
		expect(within(group).queryByText('Unread')).not.toBeInTheDocument();
	});

	it('says "1 other" for a pair', () => {
		renderList([follow('bkim', 10), follow('jtan', 20)]);
		expect(rowOf('@bkim')).toHaveTextContent('@bkim and 1 other followed you');
	});
});

describe('NotificationList read state', () => {
	it('marks an item read by its notification id when it is opened', async () => {
		renderList([invitation, result]);
		expect(within(rowOf('Which stall')).getByText('Unread')).toBeInTheDocument();

		fireEvent.click(screen.getByText(invitation.poll.title));
		expect(within(rowOf('Which stall')).queryByText('Unread')).not.toBeInTheDocument();
		expect(mockMarkRead).toHaveBeenCalledWith(['invitation_p2']);
		await waitFor(() => expect(mockRefresh).toHaveBeenCalled());

		// Opening it again sends nothing more
		fireEvent.click(screen.getByText(invitation.poll.title));
		expect(mockMarkRead).toHaveBeenCalledTimes(1);
	});

	it('opens the row\'s target from anywhere on the row', async () => {
		renderList([invitation]);
		const row = rowOf('Which stall');
		const cover = row.querySelector('a[aria-hidden="true"]')!;
		expect(cover).toHaveAttribute('href', '/poll/p2');
		expect(cover).toHaveAttribute('tabindex', '-1');

		fireEvent.click(cover);
		expect(mockMarkRead).toHaveBeenCalledWith(['invitation_p2']);
		expect(within(row).queryByText('Unread')).not.toBeInTheDocument();
	});

	it('opens the followers list from anywhere on a group of follows', () => {
		renderList([follow('bkim', 10), follow('jtan', 20)]);
		fireEvent.click(rowOf('@bkim').querySelector('button[aria-hidden="true"]')!);
		expect(screen.getByRole('dialog')).toHaveTextContent('followers of mei');
	});

	it('reads rows seen on screen in one batch, keeping their dots for this visit', async () => {
		renderList([invitation, follow('bkim', 10), follow('jtan', 20), comment]);
		const invite = rowOf('Which stall');
		scrollIntoView(invite);
		scrollIntoView(rowOf('@bkim'));
		// A read row has nothing to watch
		expect(observed.some(({ elements }) => elements.includes(rowOf('Saturday market')))).toBe(false);

		await act(() => jest.advanceTimersByTimeAsync(SEEN_MS + READ_BATCH_MS));
		await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
		expect(mockMarkRead).toHaveBeenCalledTimes(1);
		expect(readIds()).toEqual(['follow_bkim', 'follow_jtan', 'invitation_p2']);
		expect(within(invite).getByText('Unread')).toBeInTheDocument();

		// Opening it later clears the dot without asking again
		fireEvent.click(within(invite).getByRole('link', { name: 'Vote' }));
		expect(within(invite).queryByText('Unread')).not.toBeInTheDocument();
		expect(mockMarkRead).toHaveBeenCalledTimes(1);
	});

	it('leaves a row unread when it scrolls away within a second', async () => {
		renderList([invitation]);
		const row = rowOf('Which stall');
		scrollIntoView(row);
		scrollIntoView(row, 0);
		await act(() => jest.advanceTimersByTimeAsync(SEEN_MS + READ_BATCH_MS));
		expect(mockMarkRead).not.toHaveBeenCalled();
	});

	it('leaves a row unread while less than half of it is on screen', async () => {
		renderList([invitation]);
		scrollIntoView(rowOf('Which stall'), 0.2);
		await act(() => jest.advanceTimersByTimeAsync(SEEN_MS + READ_BATCH_MS));
		expect(mockMarkRead).not.toHaveBeenCalled();
	});

	it('goes by the latest of several reports that arrive together', async () => {
		renderList([invitation]);
		scrollIntoView(rowOf('Which stall'), 1, 0);
		await act(() => jest.advanceTimersByTimeAsync(SEEN_MS + READ_BATCH_MS));
		expect(mockMarkRead).not.toHaveBeenCalled();
	});

	it('sends a batch after the longest wait while rows keep being seen', async () => {
		const comments = [1, 2, 3, 4].map((n) => ({ ...comment, id: `comment_c${n}`, read: false, poll: { ...comment.poll, id: `p${n}`, title: `Poll ${n}` } }));
		renderList(comments);
		// A row every 1.5s keeps restarting the 2s batch wait
		for (const n of [1, 2, 3, 4]) {
			if (n > 1) await act(() => jest.advanceTimersByTimeAsync(1500));
			scrollIntoView(rowOf(`Poll ${n}`));
		}
		// The first row was seen at 1s, so its longest wait ends at 6s
		await act(() => jest.advanceTimersByTimeAsync(SEEN_MS + READ_MAX_WAIT_MS - 4500 - 100));
		expect(mockMarkRead).not.toHaveBeenCalled();
		await act(() => jest.advanceTimersByTimeAsync(200));
		expect(mockMarkRead).toHaveBeenCalledTimes(1);
		expect(readIds()).toEqual(['comment_c1', 'comment_c2', 'comment_c3', 'comment_c4']);
	});

	it('sends what was seen when the tab is hidden', async () => {
		renderList([invitation]);
		scrollIntoView(rowOf('Which stall'));
		await act(() => jest.advanceTimersByTimeAsync(SEEN_MS));
		Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
		act(() => {
			document.dispatchEvent(new Event('visibilitychange'));
		});
		Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
		expect(mockMarkRead).toHaveBeenCalledWith(['invitation_p2']);
	});

	it('sends ids the server left unread again with the next batch', async () => {
		mockMarkRead.mockResolvedValueOnce({ ok: true, data: ['follow_bkim'] }).mockRejectedValueOnce(new Error('offline'));
		jest.spyOn(console, 'error').mockImplementation(() => {});
		renderList([follow('bkim', 10), invitation, follow('jtan', 20)]);
		scrollIntoView(rowOf('@bkim'));
		await act(() => jest.advanceTimersByTimeAsync(SEEN_MS + READ_BATCH_MS));
		expect(mockMarkRead).toHaveBeenLastCalledWith(['follow_bkim']);

		// A rejected request goes back in the queue too
		scrollIntoView(rowOf('Which stall'));
		await act(() => jest.advanceTimersByTimeAsync(SEEN_MS + READ_BATCH_MS));
		expect(mockMarkRead).toHaveBeenLastCalledWith(['follow_bkim', 'invitation_p2']);

		scrollIntoView(rowOf('@jtan'));
		await act(() => jest.advanceTimersByTimeAsync(SEEN_MS + READ_BATCH_MS));
		expect(mockMarkRead).toHaveBeenLastCalledWith(['follow_bkim', 'invitation_p2', 'follow_jtan']);
	});

	it('waits for the tab to be visible before a row counts as seen', async () => {
		renderList([invitation]);
		const row = rowOf('Which stall');
		scrollIntoView(row);
		await act(() => jest.advanceTimersByTimeAsync(SEEN_MS / 2));
		const setVisibility = (state: string) =>
			act(() => {
				Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
				document.dispatchEvent(new Event('visibilitychange'));
			});
		setVisibility('hidden');
		await act(() => jest.advanceTimersByTimeAsync(SEEN_MS + READ_MAX_WAIT_MS));
		expect(mockMarkRead).not.toHaveBeenCalled();

		setVisibility('visible');
		await act(() => jest.advanceTimersByTimeAsync(SEEN_MS + READ_BATCH_MS));
		expect(mockMarkRead).toHaveBeenCalledWith(['invitation_p2']);
	});

	it('keeps a result unread until it is opened', async () => {
		renderList([result]);
		scrollIntoView(rowOf('Keep the library'));
		await act(() => jest.advanceTimersByTimeAsync(SEEN_MS + READ_BATCH_MS));
		expect(mockMarkRead).not.toHaveBeenCalled();
	});

	it('sends what was seen when leaving the page before the batch', async () => {
		const { unmount } = renderList([invitation]);
		scrollIntoView(rowOf('Which stall'));
		await act(() => jest.advanceTimersByTimeAsync(SEEN_MS));
		expect(mockMarkRead).not.toHaveBeenCalled();
		unmount();
		expect(mockMarkRead).toHaveBeenCalledWith(['invitation_p2']);
	});

	it('marks a follower read when the viewer follows back', async () => {
		renderList([follow('jtan', 10)]);
		fireEvent.click(screen.getByRole('button', { name: 'Follow back' }));
		expect(mockMarkRead).toHaveBeenCalledWith(['follow_jtan']);
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

		render(<NotificationList initialPage={{ items: [], nextCursor: 'n1' }} initialCategory="LIKE" viewerUsername="mei" />);
		expect(screen.getByRole('button', { name: 'Likes' })).toHaveAttribute('aria-pressed', 'true');
		fireEvent.click(screen.getByRole('button', { name: /Load more/ }));
		await waitFor(() => expect(getNotifications).toHaveBeenCalledWith('n1', 'LIKE'));
		window.history.replaceState(null, '', '/');
	});

	it('offers no read-all or unread filter', () => {
		renderList([invitation, comment]);
		expect(screen.queryByRole('button', { name: 'Mark all read' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Unread/ })).not.toBeInTheDocument();
	});

	it('says when the feed could not be loaded', () => {
		render(<NotificationList initialPage={null} viewerUsername="mei" />);
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
