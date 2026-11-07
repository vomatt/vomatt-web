import { render, screen, within } from '@testing-library/react';

import { PollSideCard, PollSideStrip } from '@/features/polls/components/PollSideCard';
import type { Poll } from '@/features/polls/schema';
import { META_GAP } from '@/lib/rich';

import { keepGaps } from '../../helpers/keepGaps';

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
		render(<PollSideCard kind="resultsIn" polls={[poll]} />);
		const card = screen.getByRole('region', { name: 'Results are in' });
		const link = within(card).getByRole('link', { name: /Bike lane on Mill Road\?/ });
		expect(link).toHaveAttribute('href', '/poll/poll-1');
		expect(within(link).getByText('1,502 voted')).toBeInTheDocument();
	});

	it('marks an unread Poll with a labelled dot', () => {
		render(<PollSideCard kind="resultsIn" polls={[{ ...poll, unread: true }, { ...poll, id: 'poll-2' }]} />);
		expect(screen.getAllByText('Unread')).toHaveLength(1);
	});

	it('says "new" in the meta of an unread Poll only', () => {
		render(<PollSideCard kind="resultsIn" polls={[{ ...poll, unread: true }, { ...poll, id: 'poll-2' }]} />);
		const [unread, read] = screen.getAllByRole('link');
		expect(within(unread).getByText('new')).toBeInTheDocument();
		expect(within(read).queryByText('new')).not.toBeInTheDocument();
	});

	it('says the turnout alone for Results are in, without a time', () => {
		render(<PollSideCard kind="resultsIn" polls={[poll]} />);
		expect(screen.getByText('1,502 voted')).toBeInTheDocument();
		expect(screen.queryByText(/ends in/)).not.toBeInTheDocument();
	});

	it('weighs unread titles over read ones in Results are in', () => {
		render(<PollSideCard kind="resultsIn" polls={[{ ...poll, unread: true, title: 'Unread one' }, { ...poll, id: 'poll-2', title: 'Read one' }]} />);
		expect(screen.getByText('Unread one')).toHaveClass('font-semibold');
		expect(screen.getByText('Read one')).toHaveClass('font-normal');
	});

	it('says what each Poll in Results are in decided, before its turnout', () => {
		const won = { ...poll, unread: true, options: [{ id: 'a', text: 'Yes', votes: 600 }, { id: 'b', text: 'No', votes: 214 }] };
		const tie = { ...poll, id: 'poll-2', options: [{ id: 'a', text: 'Yes', votes: 6 }, { id: 'b', text: 'No', votes: 6 }] };
		render(<PollSideCard kind="resultsIn" polls={[won, tie]} />);
		const [wonLink, tieLink] = screen.getAllByRole('link');
		expect(within(wonLink).getByText(/won/).textContent).toBe(`Yes won${META_GAP}1,502 voted${META_GAP}new`);
		expect(within(tieLink).getByText(/Tie/).textContent).toBe(`Tie${META_GAP}1,502 voted`);
	});

	it('says when each Poll in Closing soon ends', () => {
		render(<PollSideCard kind="closingSoon" polls={[poll]} />);
		expect(screen.getByRole('region', { name: 'Closing soon' })).toBeInTheDocument();
		expect(screen.getByText(`ends in 2h${META_GAP}1,502 voted`, keepGaps)).toBeInTheDocument();
		expect(screen.getByText(poll.title)).toHaveClass('font-medium');
	});
});

describe('PollSideStrip', () => {
	it('lists Results are in before Closing soon, each tile naming its card', () => {
		render(<PollSideStrip resultsIn={[{ ...poll, id: 'poll-2', title: 'Ended one' }]} closingSoon={[poll]} />);
		const strip = screen.getByRole('list', { name: 'Results and polls closing soon' });
		const [ended, closing] = within(strip).getAllByRole('link');
		expect(ended).toHaveAttribute('href', '/poll/poll-2');
		expect(ended).toHaveTextContent(/^Results are inEnded one/);
		expect(closing).toHaveTextContent(/^Closing soonBike lane on Mill Road\?/);
		expect(within(closing).getByText(`ends in 2h${META_GAP}1,502 voted`, keepGaps)).toBeInTheDocument();
	});

	it('renders nothing when both cards are empty', () => {
		const { container } = render(<PollSideStrip resultsIn={[]} closingSoon={[]} />);
		expect(container).toBeEmptyDOMElement();
	});
});
