import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { dayGroup, NotificationList } from '@/features/notifications/NotificationList';
import type { Poll } from '@/features/polls/schema';

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
jest.mock('@/features/polls/service', () => ({ getMyPolls: jest.fn() }));
const mockMarkRead = jest.fn();
jest.mock('@/features/notifications/service', () => ({
	markNotificationsRead: (...a: unknown[]) => mockMarkRead(...a),
	getUnreadCount: jest.fn(),
}));
const mockToastError = jest.fn();
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a) } }));
const mockRefresh = jest.fn();
jest.mock('@/features/notifications/UnreadCountProvider', () => ({
	useUnreadCount: () => ({ count: 0, isLoaded: true, refresh: mockRefresh }),
}));
jest.mock('@/features/profiles/UserChip', () => ({ ProfileAvatar: () => null }));

const HOUR = 3600_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();

const invitation: Poll = {
	id: 'poll-invite',
	title: 'Where should the book club meet?',
	active: true,
	votingActive: true,
	creatorId: 'user-2',
	creatorUsername: 'bob',
	createdAt: iso(-HOUR),
	startTime: iso(-60_000),
	endTime: iso(48 * HOUR),
	audience: 'invite-only',
	unread: true,
	options: [],
};

const ended: Poll = {
	...invitation,
	id: 'poll-ended',
	title: 'Tabs or spaces?',
	startTime: iso(-96 * HOUR),
	endTime: iso(-72 * HOUR),
	audience: 'public',
	unread: false,
	myOptionId: 'a',
	options: [
		{ id: 'a', text: 'Tabs', votes: 3 },
		{ id: 'b', text: 'Spaces', votes: 1 },
	],
	participantCount: 4,
};

beforeEach(() => jest.clearAllMocks());

describe('dayGroup()', () => {
	const now = new Date(2026, 9, 25, 15, 0);
	it('reads today, yesterday and earlier from the local calendar', () => {
		expect(dayGroup(new Date(2026, 9, 25, 0, 5).toISOString(), now)).toBe('today');
		expect(dayGroup(new Date(2026, 9, 24, 23, 59).toISOString(), now)).toBe('yesterday');
		expect(dayGroup(new Date(2026, 9, 23, 12, 0).toISOString(), now)).toBe('earlier');
	});
});

describe('NotificationList', () => {
	it('lists invitations and results newest first, grouped by day', () => {
		render(<NotificationList initialPage={{ items: [ended], nextCursor: null }} invitations={[invitation]} />);

		expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Today', 'Earlier']);
		const today = screen.getByRole('region', { name: 'Today' });
		expect(within(today).getByRole('listitem')).toHaveTextContent('@bob invited you · Where should the book club meet?');
		const earlier = screen.getByRole('region', { name: 'Earlier' });
		expect(within(earlier).getByRole('listitem')).toHaveTextContent('Results are in · Tabs or spaces?');
		expect(within(earlier).getByRole('listitem')).toHaveTextContent('Tabs won · 4 voted');
		expect(within(earlier).getByRole('listitem')).toHaveTextContent('Your pick won');
	});

	it("clears an invitation's unread dot when it is opened", () => {
		render(<NotificationList initialPage={{ items: [], nextCursor: null }} invitations={[invitation]} />);
		expect(screen.getByRole('button', { name: /Unread 1/ })).toBeInTheDocument();
		fireEvent.click(screen.getByText(invitation.title));
		expect(screen.getByRole('button', { name: /Unread 0/ })).toBeInTheDocument();
		// The poll page marks it read on the server
		expect(mockMarkRead).not.toHaveBeenCalled();
	});

	it('filters to unread, and says when everything is read', () => {
		render(<NotificationList initialPage={{ items: [ended], nextCursor: null }} invitations={[]} />);
		fireEvent.click(screen.getByRole('button', { name: /Unread/ }));
		expect(screen.getByText('You’re all caught up.')).toBeInTheDocument();
	});

	it('marks every unread notification read in one request', async () => {
		mockMarkRead.mockImplementation(async (ids: string[]) => ids);
		const unreadResult = { ...ended, id: 'poll-new', unread: true };
		render(<NotificationList initialPage={{ items: [unreadResult, ended], nextCursor: null }} invitations={[invitation]} />);

		fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));
		await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
		expect(mockMarkRead).toHaveBeenCalledTimes(1);
		expect([...mockMarkRead.mock.calls[0][0]].sort()).toEqual(['poll-invite', 'poll-new']);
		expect(screen.queryByText('Unread', { selector: '.sr-only' })).not.toBeInTheDocument();
		expect(mockToastError).not.toHaveBeenCalled();
	});

	it('keeps the dot on rows the server failed to mark, and says so', async () => {
		mockMarkRead.mockResolvedValue(['poll-new']);
		const unreadResult = { ...ended, id: 'poll-new', unread: true };
		render(<NotificationList initialPage={{ items: [unreadResult], nextCursor: null }} invitations={[invitation]} />);

		fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));
		await waitFor(() => expect(mockToastError).toHaveBeenCalled());
		expect(screen.getByRole('button', { name: /Unread 1/ })).toBeInTheDocument();
	});

	it('dates an invitation by when it was sent, not when the poll opens', () => {
		const scheduled = { ...invitation, createdAt: iso(-72 * HOUR), startTime: iso(72 * HOUR), endTime: iso(96 * HOUR) };
		render(<NotificationList initialPage={{ items: [], nextCursor: null }} invitations={[scheduled]} />);
		expect(screen.getByRole('region', { name: 'Earlier' })).toHaveTextContent('invited you');
	});

	it('words a cancelled poll without an action', () => {
		const cancelled = { ...ended, id: 'c', endTime: ended.startTime, title: 'Night bus?' };
		render(<NotificationList initialPage={{ items: [cancelled], nextCursor: null }} invitations={[]} />);
		const row = screen.getByRole('listitem');
		expect(row).toHaveTextContent('Night bus? was cancelled by @bob');
		expect(row).toHaveTextContent('Your vote was never counted');
	});

	it('shows the empty state only when there is nothing at all', () => {
		render(<NotificationList initialPage={{ items: [], nextCursor: null }} invitations={[]} />);
		expect(screen.getByRole('heading', { level: 1, name: 'Notifications' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 2, name: 'No notifications yet.' })).toBeInTheDocument();
		expect(screen.getByText('Results of polls you asked or voted in show up here.')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Mark all read' })).not.toBeInTheDocument();
	});
});
