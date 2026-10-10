import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { MarkNotificationRead } from '@/features/notifications/MarkNotificationRead';
import { NotificationList } from '@/features/notifications/NotificationList';
import {
	UNREAD_POLL_MS,
	UnreadCountProvider,
	useUnreadCount,
} from '@/features/notifications/UnreadCountProvider';
import type { Poll } from '@/features/polls/schema';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/link', () => {
	const Link = ({ children, href, onClick, className }: any) => (
		<a
			href={href}
			className={className}
			onClick={(event) => {
				event.preventDefault();
				onClick?.(event);
			}}
		>
			{children}
		</a>
	);
	return Link;
});

const mockGetUnreadCount = jest.fn();
const mockMarkRead = jest.fn();
jest.mock('@/features/notifications/service', () => ({
	getUnreadCount: () => mockGetUnreadCount(),
	markNotificationRead: (id: string) => mockMarkRead(id),
}));
jest.mock('@/features/polls/service', () => ({ getMyPolls: jest.fn() }));

function Count() {
	return <span data-testid="count">{useUnreadCount().count}</span>;
}

function setVisibility(state: 'visible' | 'hidden') {
	Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
	document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
	jest.clearAllMocks();
	mockGetUnreadCount.mockResolvedValue(2);
	mockMarkRead.mockResolvedValue(undefined);
	Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
});

describe('UnreadCountProvider', () => {
	it('never asks when signed out', () => {
		render(
			<UnreadCountProvider signedIn={false}>
				<Count />
			</UnreadCountProvider>
		);
		expect(mockGetUnreadCount).not.toHaveBeenCalled();
		expect(screen.getByTestId('count')).toHaveTextContent('0');
	});

	it('polls while visible and pauses while hidden', async () => {
		jest.useFakeTimers();
		render(
			<UnreadCountProvider signedIn>
				<Count />
			</UnreadCountProvider>
		);
		await act(async () => {});
		expect(screen.getByTestId('count')).toHaveTextContent('2');
		expect(mockGetUnreadCount).toHaveBeenCalledTimes(1);

		await act(async () => jest.advanceTimersByTime(UNREAD_POLL_MS));
		expect(mockGetUnreadCount).toHaveBeenCalledTimes(2);

		act(() => setVisibility('hidden'));
		await act(async () => jest.advanceTimersByTime(UNREAD_POLL_MS * 3));
		expect(mockGetUnreadCount).toHaveBeenCalledTimes(2);

		// Coming back checks at once
		await act(async () => setVisibility('visible'));
		expect(mockGetUnreadCount).toHaveBeenCalledTimes(3);
		jest.useRealTimers();
	});
});

describe('UnreadCountProvider when the session ends', () => {
	it('stops polling and hides the badge', async () => {
		jest.useFakeTimers();
		mockGetUnreadCount.mockResolvedValueOnce(2).mockResolvedValue(null);
		render(
			<UnreadCountProvider signedIn>
				<Count />
			</UnreadCountProvider>
		);
		await act(async () => {});
		expect(screen.getByTestId('count')).toHaveTextContent('2');

		await act(async () => jest.advanceTimersByTime(UNREAD_POLL_MS));
		expect(screen.getByTestId('count')).toHaveTextContent('0');
		await act(async () => jest.advanceTimersByTime(UNREAD_POLL_MS * 3));
		expect(mockGetUnreadCount).toHaveBeenCalledTimes(2);
		jest.useRealTimers();
	});
});

describe('MarkNotificationRead', () => {
	it('marks the poll read once the count shows something unread', async () => {
		render(
			<UnreadCountProvider signedIn>
				<MarkNotificationRead pollId="p1" />
			</UnreadCountProvider>
		);
		await waitFor(() => expect(mockMarkRead).toHaveBeenCalledWith('p1'));
		expect(mockMarkRead).toHaveBeenCalledTimes(1);
	});

	it('skips the request when nothing is unread', async () => {
		mockGetUnreadCount.mockResolvedValue(0);
		render(
			<UnreadCountProvider signedIn>
				<MarkNotificationRead pollId="p1" />
			</UnreadCountProvider>
		);
		await waitFor(() => expect(mockGetUnreadCount).toHaveBeenCalled());
		await act(async () => {});
		expect(mockMarkRead).not.toHaveBeenCalled();
	});
});

describe('NotificationList', () => {
	const poll = {
		id: 'p1',
		title: 'Lunch?',
		startTime: '2026-10-01T00:00:00Z',
		endTime: '2026-10-02T00:00:00Z',
		unread: true,
	} as Poll;

	it('clears the dot when opened, leaving the marking to the poll page', () => {
		render(<NotificationList initialPage={{ items: [poll], nextCursor: null }} />);
		expect(screen.getByLabelText('Unread')).toBeInTheDocument();

		fireEvent.click(screen.getByText('Lunch?'));
		expect(screen.queryByLabelText('Unread')).not.toBeInTheDocument();
		expect(mockMarkRead).not.toHaveBeenCalled();
	});

	it('labels a cancelled poll', () => {
		render(
			<NotificationList
				initialPage={{ items: [{ ...poll, endTime: poll.startTime, unread: false }], nextCursor: null }}
			/>
		);
		expect(screen.getByText('Cancelled')).toBeInTheDocument();
	});
});
