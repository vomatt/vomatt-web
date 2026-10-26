import { render, screen } from '@testing-library/react';

import { PollAbout } from '@/features/polls/components/PollAbout';
import type { Poll } from '@/features/polls/schema';

jest.mock('next/link', () => {
	return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
		return <a href={href}>{children}</a>;
	};
});
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

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

	it('is one line once a Poll has Ended: no rules, dates or topics', () => {
		// One timestamp: two iso() calls can land a millisecond apart and read as ended early
		const ended = iso(-HOUR);
		render(
			<PollAbout
				poll={{ ...poll, endTime: ended, deadline: ended, tags: [{ id: 't1', name: 'Market', slug: 'market' }] }}
			/>
		);
		expect(screen.getByRole('heading', { name: 'About this poll' })).toBeInTheDocument();
		expect(screen.getByText('Voting has closed. Results are in.')).toBeInTheDocument();
		expect(screen.queryByText(/^Ballots are sealed/)).not.toBeInTheDocument();
		expect(screen.queryByText('Opened')).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Market' })).not.toBeInTheDocument();
	});

	it('lists the rules of an Open Poll, with who will see each choice', () => {
		render(<PollAbout poll={{ ...poll, voterVisibility: 'owner' }} />);
		expect(screen.getByText('Ballots are sealed. Counts are revealed only when the poll ends.')).toBeInTheDocument();
		expect(screen.getByText('One vote per person. You can change it until the end.')).toBeInTheDocument();
		expect(screen.getByText('After it ends, only the poll owner can see what you chose.')).toBeInTheDocument();
	});

	it('shows when the Poll opened and when its results come, with how far through it is', () => {
		render(<PollAbout poll={poll} />);
		expect(screen.getByText('Opened')).toBeInTheDocument();
		expect(screen.getByText('Results')).toBeInTheDocument();
		// Opened 48h ago, ends in 24h
		expect(screen.getByRole('progressbar', { name: 'Voting window' })).toHaveAttribute('aria-valuenow', '67');
	});

	it('links its topics by name, without a #', () => {
		render(<PollAbout poll={{ ...poll, tags: [{ id: 't1', name: 'Market', slug: 'market' }] }} />);
		expect(screen.getByRole('link', { name: 'Market' })).toHaveAttribute('href', expect.stringContaining('market'));
	});

	it('leaves out who asked, the turnout, the audience note and Share', () => {
		render(<PollAbout poll={{ ...poll, audience: 'invite-only', inviteeCount: 12 }} />);
		expect(screen.queryByText('mei.lin')).not.toBeInTheDocument();
		expect(screen.queryByText(/invited/)).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
	});
});
