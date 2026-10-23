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
	it("shows the creator's chosen avatar", () => {
		const { container } = render(<PollAbout poll={{ ...poll, creatorAvatarUrl: 'bot:bear' }} />);
		expect(container.querySelector('img')).toHaveAttribute('src', '/avatars/bear.svg');
	});

	it('says a Poll ended early, with its Deadline', () => {
		render(<PollAbout poll={{ ...poll, active: false, endTime: iso(-HOUR), deadline: iso(24 * HOUR) }} />);
		expect(screen.getByText(/^Ended early\. It was set to close/)).toBeInTheDocument();
	});

	it('says results are in when it ran to its Deadline', () => {
		// One timestamp: two iso() calls can land a millisecond apart and read as ended early
		const ended = iso(-HOUR);
		render(<PollAbout poll={{ ...poll, endTime: ended, deadline: ended }} />);
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

	it('lists the rules of an Open Poll, with who will see each choice', () => {
		render(<PollAbout poll={{ ...poll, voterVisibility: 'owner' }} />);
		expect(screen.getByText('Ballots are sealed. Counts are revealed only when the poll ends.')).toBeInTheDocument();
		expect(screen.getByText('One vote per person. You can change or withdraw it until the poll ends.')).toBeInTheDocument();
		expect(screen.getByText('After it ends, only the poll owner can see what you chose.')).toBeInTheDocument();
	});

	it('leaves the rules out once a Poll has Ended', () => {
		const ended = iso(-HOUR);
		render(<PollAbout poll={{ ...poll, endTime: ended, deadline: ended }} />);
		expect(screen.queryByText(/^Ballots are sealed/)).not.toBeInTheDocument();
	});

	it('shows how far through its voting window the Poll is', () => {
		render(<PollAbout poll={poll} />);
		// Opened 48h ago, ends in 24h
		expect(screen.getByRole('progressbar', { name: 'Voting window' })).toHaveAttribute('aria-valuenow', '67');
	});

	it('says nothing about the Audience of a Public Poll', () => {
		render(<PollAbout poll={{ ...poll, audience: 'public', inviteeCount: null }} />);
		expect(screen.queryByText(/invited/)).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Invite others to vote' })).toBeInTheDocument();
	});
});
