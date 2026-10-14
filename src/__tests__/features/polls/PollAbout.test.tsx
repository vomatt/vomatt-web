import { render, screen } from '@testing-library/react';

import { PollAbout } from '@/features/polls/components/PollAbout';
import type { Poll } from '@/features/polls/schema';

jest.mock('next/link', () => {
	return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
		return <a href={href}>{children}</a>;
	};
});
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('@/features/polls/hooks/useSharePoll', () => ({ useSharePoll: () => jest.fn() }));

const HOUR = 3600_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();

const poll: Poll = {
	id: 'poll-1',
	title: 'Which day?',
	active: true,
	votingActive: true,
	creatorId: 'user-1',
	creatorUsername: 'mei.lin',
	createdAt: iso(-48 * HOUR),
	startTime: iso(-48 * HOUR),
	endTime: iso(24 * HOUR),
	participantCount: 5,
	options: [],
};

describe('PollAbout', () => {
	it('says a Poll ended early, with its Deadline', () => {
		render(<PollAbout poll={{ ...poll, active: false, endTime: iso(-HOUR), deadline: iso(24 * HOUR) }} />);
		expect(screen.getByText(/^Ended early\. It was set to close/)).toBeInTheDocument();
	});

	it('says results are in when it ran to its Deadline', () => {
		render(<PollAbout poll={{ ...poll, endTime: iso(-HOUR), deadline: iso(-HOUR) }} />);
		expect(screen.getByText('Voting has closed. Results are in.')).toBeInTheDocument();
	});

	it('shows who an Invite-only Poll is for and how many were invited', () => {
		render(<PollAbout poll={{ ...poll, audience: 'invite-only', inviteeCount: 12 }} />);
		expect(screen.getByText(/12 invited/)).toBeInTheDocument();
		expect(screen.getByText(/Only the people invited can see it and vote\./)).toBeInTheDocument();
		// Sharing the link can't invite anyone
		expect(screen.queryByRole('button', { name: 'Invite others to vote' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
	});

	it('says nothing about the Audience of a Public Poll', () => {
		render(<PollAbout poll={{ ...poll, audience: 'public', inviteeCount: null }} />);
		expect(screen.queryByText(/invited/)).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Invite others to vote' })).toBeInTheDocument();
	});
});
