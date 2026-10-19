import { fireEvent, render, screen } from '@testing-library/react';

import MyPollsTabs from '@/app/(frontend)/my-polls/_components/MyPollsTabs';
import type { Poll } from '@/features/polls/schema';

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));
jest.mock('@/features/polls/service', () => ({ getMyPolls: jest.fn() }));
jest.mock('@/features/polls/components/DraftList', () => ({ DraftList: () => <p>Drafts</p> }));

const ME = 'me';

function poll(id: string, creatorId: string, ended: boolean, myOptionId?: string, votes: boolean = true): Poll {
	return {
		id,
		title: id,
		active: true,
		votingActive: !ended,
		creatorId,
		creatorUsername: creatorId,
		createdAt: '2026-10-01T00:00:00Z',
		startTime: '2026-10-01T00:00:00Z',
		endTime: ended ? '2026-10-04T00:00:00Z' : '2999-01-01T00:00:00Z',
		options: [
			{ id: 'a', text: 'Tea', votes: votes ? 3 : undefined },
			{ id: 'b', text: 'Coffee', votes: votes ? 1 : undefined },
		],
		totalVotes: votes ? 4 : undefined,
		myOptionId,
	};
}

const page = (items: Poll[]) => ({ items, nextCursor: null });

describe('MyPollsTabs', () => {
	it('shows turnout for polls the user asked, even ones they voted in', () => {
		render(<MyPollsTabs open={page([poll('mine', ME, false, 'a')])} ended={page([])} userId={ME} />);

		expect(screen.getByText('4 voted')).toBeInTheDocument();
		expect(screen.queryByText(/You chose/)).not.toBeInTheDocument();
	});

	it("shows the user's pick for an open poll they only voted in", () => {
		render(<MyPollsTabs open={page([poll('theirs', 'other', false, 'b')])} ended={page([])} userId={ME} />);

		expect(screen.getByText(/You chose/)).toBeInTheDocument();
		expect(screen.getByText('Coffee')).toBeInTheDocument();
		expect(screen.getByText(/^Ends /)).toBeInTheDocument();
	});

	it('adds the outcome beside the status once such a poll has ended', () => {
		render(<MyPollsTabs open={page([])} ended={page([poll('theirs', 'other', true, 'a')])} userId={ME} />);
		fireEvent.click(screen.getByRole('tab', { name: /^Ended/ }));

		expect(screen.getByText('Your pick won')).toBeInTheDocument();
		expect(screen.getByRole('link')).toHaveTextContent(/Ended \w+ \d/);
	});

	it('shows only the status when an ended poll withholds its counts', () => {
		render(
			<MyPollsTabs open={page([])} ended={page([poll('theirs', 'other', true, 'a', false)])} userId={ME} />
		);
		fireEvent.click(screen.getByRole('tab', { name: /^Ended/ }));

		expect(screen.getByText(/You chose/)).toBeInTheDocument();
		expect(screen.getByRole('link')).toHaveTextContent(/Ended \w+ \d/);
		expect(screen.queryByText(/Your pick|Tied|Outvoted/)).not.toBeInTheDocument();
	});
});
