import { fireEvent, render, screen } from '@testing-library/react';

import { NotificationList } from '@/features/notifications/NotificationList';
import type { Poll } from '@/features/polls/schema';

jest.mock('next/link', () => {
	return function MockLink({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) {
		return (
			<a href={href} onClick={(e) => { e.preventDefault(); onClick?.(); }}>
				{children}
			</a>
		);
	};
});
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('@/features/polls/service', () => ({ getMyPolls: jest.fn() }));

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
	startTime: iso(-HOUR),
	endTime: iso(48 * HOUR),
	audience: 'invite-only',
	unread: true,
	options: [],
};

const ended: Poll = {
	...invitation,
	id: 'poll-ended',
	title: 'Tabs or spaces?',
	startTime: iso(-48 * HOUR),
	endTime: iso(-HOUR),
	audience: 'public',
	unread: false,
};

describe('NotificationList', () => {
	it('lists Invitations above the ended Polls', () => {
		render(
			<NotificationList
				initialPage={{ items: [ended], nextCursor: null }}
				invitations={[invitation]}
			/>
		);
		const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
		expect(headings).toEqual(['Invitations', 'Results']);
		expect(screen.getByText('bob invited you')).toBeInTheDocument();
		expect(screen.getByText('Results are in')).toBeInTheDocument();
	});

	it('clears an Invitation\'s unread dot when it is opened', () => {
		render(<NotificationList initialPage={{ items: [], nextCursor: null }} invitations={[invitation]} />);
		expect(screen.getByText('Unread')).toBeInTheDocument();
		fireEvent.click(screen.getByText(invitation.title));
		expect(screen.queryByText('Unread')).not.toBeInTheDocument();
	});

	it('shows the empty state only when there is nothing at all', () => {
		render(<NotificationList initialPage={{ items: [], nextCursor: null }} invitations={[]} />);
		expect(screen.getByText('No notifications yet.')).toBeInTheDocument();
	});
});
