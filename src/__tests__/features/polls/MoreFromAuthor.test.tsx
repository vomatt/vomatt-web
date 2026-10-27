import { render, screen, within } from '@testing-library/react';

import { MoreFromAuthor } from '@/features/polls/components/MoreFromAuthor';
import type { Poll } from '@/features/polls/schema';

jest.mock('next/link', () => {
	return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
		return <a href={href}>{children}</a>;
	};
});
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

const HOUR = 3600_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();

const ended: Poll = {
	id: 'poll-2',
	title: 'Fortnightly street cleaning?',
	active: true,
	votingActive: true,
	creatorId: 'user-1',
	creatorUsername: 'amira',
	createdAt: iso(-96 * HOUR),
	startTime: iso(-96 * HOUR),
	endTime: iso(-HOUR),
	participantCount: 611,
	options: [],
};

describe('MoreFromAuthor', () => {
	it("links the author's other Polls under their handle, with status and turnout", () => {
		render(<MoreFromAuthor username="amira" polls={[ended]} />);
		const card = screen.getByRole('region', { name: 'More from @amira' });
		const link = within(card).getByRole('link', { name: /Fortnightly street cleaning\?/ });
		expect(link).toHaveAttribute('href', '/poll/poll-2');
		expect(within(link).getByText('ended · 611 voted')).toBeInTheDocument();
	});

	it('says when an Open Poll ends beside its turnout', () => {
		render(<MoreFromAuthor username="amira" polls={[{ ...ended, endTime: iso(2 * HOUR + 60_000), participantCount: 96 }]} />);
		expect(screen.getByText('ends in 2h · 96 voted')).toBeInTheDocument();
	});
});
