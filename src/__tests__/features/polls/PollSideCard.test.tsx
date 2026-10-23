import { render, screen, within } from '@testing-library/react';

import { PollSideCard } from '@/features/polls/components/PollSideCard';
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
	title: 'Bike lane on Mill Road?',
	active: true,
	votingActive: true,
	creatorId: 'user-1',
	creatorUsername: 'mei.lin',
	createdAt: iso(-48 * HOUR),
	startTime: iso(-48 * HOUR),
	endTime: iso(2 * HOUR + 60_000),
	participantCount: 1502,
	options: [],
};

describe('PollSideCard', () => {
	it('links each Poll under a named heading, with its turnout', () => {
		render(<PollSideCard headingKey="homePage.resultsIn" polls={[poll]} />);
		const card = screen.getByRole('region', { name: 'Results are in' });
		const link = within(card).getByRole('link', { name: /Bike lane on Mill Road\?/ });
		expect(link).toHaveAttribute('href', '/poll/poll-1');
		expect(within(link).getByText('1,502 voted')).toBeInTheDocument();
	});

	it('marks an unread Poll with a labelled dot', () => {
		render(<PollSideCard headingKey="homePage.resultsIn" polls={[{ ...poll, unread: true }, { ...poll, id: 'poll-2' }]} />);
		expect(screen.getAllByText('Unread')).toHaveLength(1);
	});

	it('says when an Open Poll ends', () => {
		render(<PollSideCard headingKey="homePage.closingSoon" polls={[poll]} showEndsIn />);
		expect(screen.getByText('Ends in 2 hours · 1,502 voted')).toBeInTheDocument();
	});
});
