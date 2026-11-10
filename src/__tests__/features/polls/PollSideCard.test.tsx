import { render, screen, within } from '@testing-library/react';

import { PollSideCard } from '@/features/polls/components/PollSideCard';
import { META_GAP } from '@/lib/rich';

import { keepGaps } from '../../helpers/keepGaps';
import { sidePoll } from '../../helpers/sidePoll';
import { visibleText } from '../../helpers/visibleText';

jest.mock('next/link', () => {
	return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
		return <a href={href}>{children}</a>;
	};
});
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('@/features/polls/service', () => ({}));

const poll = sidePoll;

describe('PollSideCard', () => {
	it('links each Poll under a named heading, with its turnout', () => {
		render(<PollSideCard kind="resultsIn" polls={[poll]} />);
		const card = screen.getByRole('region', { name: 'Results are in' });
		const link = within(card).getByRole('link', { name: /Bike lane on Mill Road\?/ });
		expect(link).toHaveAttribute('href', '/poll/poll-1');
		expect(within(link).getByText('1,502 voted')).toBeInTheDocument();
	});

	it.each([
		['resultsIn', 'Results are in', '/results-in'],
		['closingSoon', 'Closing soon', '/closing-soon'],
	] as const)('links the %s title to its whole feed', (kind, title, href) => {
		render(<PollSideCard kind={kind} polls={[poll]} />);
		const heading = screen.getByRole('heading', { name: title });
		expect(within(heading).getByRole('link', { name: title })).toHaveAttribute('href', href);
	});

	it('marks an unread Poll with a labelled dot', () => {
		render(<PollSideCard kind="resultsIn" polls={[{ ...poll, unread: true }, { ...poll, id: 'poll-2' }]} />);
		expect(screen.getAllByText('Unread')).toHaveLength(1);
	});

	it('says "new" in the meta of an unread Poll only', () => {
		render(<PollSideCard kind="resultsIn" polls={[{ ...poll, unread: true }, { ...poll, id: 'poll-2' }]} />);
		const [unread, read] = within(screen.getByRole('list')).getAllByRole('link');
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
		const [wonLink, tieLink] = within(screen.getByRole('list')).getAllByRole('link');
		expect(visibleText(within(wonLink).getByText(/won/))).toBe(`Yes won${META_GAP}1,502 voted${META_GAP}new`);
		expect(within(tieLink).getByText(/voted/).textContent).toBe(`Tie${META_GAP}1,502 voted`);
	});

	it('stamps the winner of a Poll in Results are in; a tie names no option to stamp', () => {
		const won = { ...poll, options: [{ id: 'a', text: 'Yes', votes: 600 }, { id: 'b', text: 'No', votes: 214 }] };
		const tie = { ...poll, id: 'poll-2', options: [{ id: 'a', text: 'Yes', votes: 6 }, { id: 'b', text: 'No', votes: 6 }] };
		render(<PollSideCard kind="resultsIn" polls={[won, tie]} />);
		const [wonLink, tieLink] = within(screen.getByRole('list')).getAllByRole('link');
		// The stamp is decorative: "won" already says it, so screen readers don't hear "Elected" too
		expect(within(wonLink).getByText(/won/).querySelectorAll('strong svg[aria-hidden]')).toHaveLength(1);
		expect(tieLink.querySelector('svg')).not.toBeInTheDocument();
	});

	it('says when each Poll in Closing soon ends', () => {
		render(<PollSideCard kind="closingSoon" polls={[poll]} />);
		expect(screen.getByRole('region', { name: 'Closing soon' })).toBeInTheDocument();
		expect(screen.getByText(`ends in 2h${META_GAP}1,502 voted`, keepGaps)).toBeInTheDocument();
		expect(screen.getByText(poll.title)).toHaveClass('font-medium');
	});
});
