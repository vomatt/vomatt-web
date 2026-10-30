import { render, screen } from '@testing-library/react';

import { PollTile } from '@/features/polls/components/PollTile';
import type { Poll } from '@/features/polls/schema';

jest.mock('next/link', () => {
	return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
		return <a href={href}>{children}</a>;
	};
});
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

const HOUR = 3600_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();
const option = (id: string, text: string, votes?: number) => ({ id, text, votes });

const open: Poll = {
	id: 'poll-1',
	title: 'Bike lane on Mill Road?',
	active: true,
	votingActive: true,
	creatorId: 'user-1',
	creatorUsername: 'mei.lin',
	createdAt: iso(-48 * HOUR),
	startTime: iso(-48 * HOUR),
	endTime: iso(48 * HOUR),
	participantCount: 1502,
	options: ['Yes', 'No', 'Later', 'Never', 'Unsure'].map((text, i) => option(`o${i}`, text)),
	tags: [{ id: 't1', slug: 'transport', name: 'Transport' }],
};

const ended: Poll = {
	...open,
	active: false,
	votingActive: false,
	endTime: iso(-HOUR),
	options: [option('o0', 'Yes', 30), option('o1', 'No', 10)],
};

const renderTile = (poll: Poll) => render(<ul><PollTile poll={poll} /></ul>);

describe('PollTile', () => {
	it('links the question to the poll page', () => {
		renderTile(open);
		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Bike lane on Mill Road?');
		expect(screen.getByRole('link', { name: 'Bike lane on Mill Road?' })).toHaveAttribute('href', '/poll/poll-1');
	});

	it('names the first options of an open poll, with turnout and topics but no counts', () => {
		renderTile(open);
		expect(screen.getByText('Yes')).toBeInTheDocument();
		expect(screen.getByText('Later')).toBeInTheDocument();
		expect(screen.queryByText('Never')).not.toBeInTheDocument();
		expect(screen.getByText('+2 more')).toBeInTheDocument();
		expect(screen.getByText('1,502 voted').parentElement).toHaveTextContent('1,502 voted · Transport');
		expect(screen.queryByText(/won/)).not.toBeInTheDocument();
	});

	it('shows Voted on an open poll the viewer voted in', () => {
		renderTile({ ...open, myOptionId: 'o0' });
		expect(screen.getByText('Voted')).toBeInTheDocument();
	});

	it('says what an ended poll decided instead of its options', () => {
		renderTile({ ...ended, myOptionId: 'o0' });
		expect(screen.getByText(/won/)).toHaveTextContent('Yes won');
		expect(screen.queryByText('No')).not.toBeInTheDocument();
		expect(screen.queryByText('Voted')).not.toBeInTheDocument();
	});

	it('shows no turnout for a scheduled poll', () => {
		renderTile({ ...open, startTime: iso(HOUR) });
		expect(screen.queryByText(/voted/)).not.toBeInTheDocument();
		expect(screen.getByText('Transport')).toBeInTheDocument();
	});
});
