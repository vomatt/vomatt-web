import { fireEvent, render, screen } from '@testing-library/react';

import { HomeRail } from '@/app/(frontend)/_components/HomeRail';
import type { RailPolls } from '@/app/(frontend)/_components/RailPolls';
import type { Poll } from '@/features/polls/schema';

jest.mock('next/link', () => {
	return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
		return <a href={href}>{children}</a>;
	};
});
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

const mockGetMyPolls = jest.fn();
const mockGetPolls = jest.fn();
jest.mock('@/features/polls/service', () => ({
	getMyPolls: (...args: unknown[]) => mockGetMyPolls(...args),
	getPolls: (...args: unknown[]) => mockGetPolls(...args),
}));

// An async Server Component can't render on the client: the rail gets a stand-in, and
// the real one is awaited on its own below
jest.mock('@/app/(frontend)/_components/RailPolls', () => ({
	RailPolls: () => <p>Poll cards</p>,
}));
const { RailPolls: realRailPolls } = jest.requireActual<{ RailPolls: typeof RailPolls }>(
	'@/app/(frontend)/_components/RailPolls'
);

// The creator itself is out of scope; the trigger only has to open it
jest.mock('next/dynamic', () => () =>
	function MockPollCreator({ open }: { open: boolean }) {
		return open ? <div role="dialog" aria-label="Create a poll" /> : null;
	}
);

const HOUR = 3600_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();

const closing: Poll = {
	id: 'poll-1',
	title: 'New name for the community garden',
	active: true,
	votingActive: true,
	creatorId: 'user-1',
	creatorUsername: 'mei.lin',
	createdAt: iso(-48 * HOUR),
	startTime: iso(-48 * HOUR),
	endTime: iso(2 * HOUR),
	participantCount: 96,
	voterVisibility: 'owner',
	options: [],
};

beforeEach(() => {
	jest.clearAllMocks();
	mockGetMyPolls.mockResolvedValue({ items: [{ ...closing, id: 'poll-2', myOptionId: null }], nextCursor: null });
	mockGetPolls.mockResolvedValue({ items: [closing], nextCursor: null });
});

describe('HomeRail', () => {
	it('invites a signed-in viewer to ask, and Write one opens the creator', () => {
		render(<HomeRail signedIn />);
		const card = screen.getByRole('region', { name: 'Got a question for everyone?' });
		expect(card).toHaveTextContent('A poll takes a minute to write and seals itself the moment it opens.');
		expect(screen.queryByText('Log in or sign up for Vomatt')).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Write one' }));
		expect(screen.getByRole('dialog', { name: 'Create a poll' })).toBeInTheDocument();
	});

	it('tells a guest how vomatt counts instead of listing Polls or inviting them to ask', () => {
		render(<HomeRail signedIn={false} />);
		expect(screen.getByRole('region', { name: 'How vomatt counts' })).toHaveTextContent(
			'One vote per person. Ballots stay sealed while a poll is open, so nobody votes with the crowd.'
		);
		expect(screen.queryByText('Poll cards')).not.toBeInTheDocument();
		expect(screen.queryByRole('region', { name: 'Got a question for everyone?' })).not.toBeInTheDocument();
	});

	it('holds the Poll cards in one aside with the rest of the rail', () => {
		render(<HomeRail signedIn />);
		expect(screen.getByRole('complementary')).toHaveTextContent('Poll cards');
	});
});

describe('RailPolls', () => {
	it('lists Polls closing soon, leaving out Ended ones the viewer didn’t vote in', async () => {
		render(await realRailPolls());
		expect(screen.getByRole('region', { name: 'Closing soon' })).toHaveTextContent(
			'New name for the community garden'
		);
		expect(screen.queryByRole('region', { name: 'Results are in' })).not.toBeInTheDocument();
	});
});
