import { fireEvent, render, screen } from '@testing-library/react';

import { VoterList } from '@/features/polls/components/VoterList';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/link', () => {
	const Link = ({ children, href }: any) => <a href={href}>{children}</a>;
	return Link;
});

const mockGetVoters = jest.fn();
jest.mock('@/features/polls/service', () => ({
	getVoters: (...args: unknown[]) => mockGetVoters(...args),
}));

const poll = {
	id: 'p1',
	options: [
		{ id: 'o1', text: 'Tabs' },
		{ id: 'o2', text: 'Spaces' },
	],
};
const voter = (userId: string, optionId: string) => ({
	userId,
	username: userId,
	optionId,
	votedAt: '2026-10-01T00:00:00Z',
});

beforeEach(() => jest.clearAllMocks());

describe('VoterList', () => {
	it('loads on request and groups voters by option, then pages', async () => {
		mockGetVoters
			.mockResolvedValueOnce({ ok: true, data: { items: [voter('mei', 'o1')], nextCursor: 'n1' } })
			.mockResolvedValueOnce({ ok: true, data: { items: [voter('klaus', 'o2')], nextCursor: null } });
		render(<VoterList poll={poll} />);
		expect(mockGetVoters).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: 'See who voted' }));
		expect(await screen.findByRole('link', { name: 'mei' })).toBeInTheDocument();
		expect(screen.queryByText('Spaces')).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: /more/i }));
		expect(await screen.findByRole('link', { name: 'klaus' })).toBeInTheDocument();
		expect(mockGetVoters).toHaveBeenLastCalledWith('p1', 'n1');
	});

	it('explains when Voter Visibility hides the list', async () => {
		mockGetVoters.mockResolvedValue({ ok: false, status: 403, errorCode: 'vote.voters.hidden', message: 'no' });
		render(<VoterList poll={poll} />);
		fireEvent.click(screen.getByRole('button', { name: 'See who voted' }));
		expect(await screen.findByText("You can't see who voted in this poll.")).toBeInTheDocument();
	});

	it('says when loading failed', async () => {
		mockGetVoters.mockResolvedValue({ ok: false, status: 500, message: 'down' });
		render(<VoterList poll={poll} />);
		fireEvent.click(screen.getByRole('button', { name: 'See who voted' }));
		expect(await screen.findByText("Couldn't load who voted.")).toBeInTheDocument();
	});
});
