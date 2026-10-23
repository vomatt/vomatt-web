import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';

import { MAX_VOTER_PAGES, useVoters, VotersDialog } from '@/features/polls/components/VoterList';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/link', () => {
	const Link = ({ children, href }: any) => <a href={href}>{children}</a>;
	return Link;
});

const mockGetVoters = jest.fn();
jest.mock('@/features/polls/service', () => ({
	getVoters: (...args: unknown[]) => mockGetVoters(...args),
}));

type Option = { id: string; text: string; votes: number };
const defaultOptions: Option[] = [
	{ id: 'o1', text: 'Tabs', votes: 2 },
	{ id: 'o2', text: 'Spaces', votes: 1 },
];
const voter = (userId: string, optionId: string | null) => ({
	userId,
	username: userId,
	optionId,
	votedAt: '2026-10-01T00:00:00Z',
});

/** The way PollCard drives the dialog: one voter list, an option at a time. */
function Harness({ options = defaultOptions }: { options?: Option[] }) {
	const voters = useVoters('p1', 'me');
	const [option, setOption] = useState<Option | null>(null);
	return (
		<>
			{options.map((o) => (
				<button
					key={o.id}
					onClick={() => {
						setOption(o);
						voters.load(o);
					}}
				>
					{o.text}
				</button>
			))}
			<VotersDialog option={option} voters={voters} onClose={() => setOption(null)} />
		</>
	);
}

beforeEach(() => jest.clearAllMocks());

describe('VotersDialog', () => {
	it('pages in every voter once and lists only the chosen option', async () => {
		mockGetVoters
			.mockResolvedValueOnce({ ok: true, data: { items: [voter('mei', 'o1')], nextCursor: 'n1' } })
			.mockResolvedValueOnce({
				ok: true,
				data: { items: [voter('klaus', 'o2'), voter('ann', 'o1')], nextCursor: null },
			});
		render(<Harness />);
		expect(mockGetVoters).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: 'Tabs' }));
		const dialog = await screen.findByRole('dialog');
		expect(await within(dialog).findByRole('link', { name: /ann/ })).toBeInTheDocument();
		expect(within(dialog).getByRole('link', { name: /mei/ })).toHaveAttribute('href', expect.stringContaining('mei'));
		expect(within(dialog).queryByRole('link', { name: /klaus/ })).not.toBeInTheDocument();
		expect(mockGetVoters).toHaveBeenLastCalledWith('p1', 'n1');

		fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
		fireEvent.click(screen.getByRole('button', { name: 'Spaces' }));
		expect(await screen.findByRole('link', { name: /klaus/ })).toBeInTheDocument();
		expect(mockGetVoters).toHaveBeenCalledTimes(2);
	});

	it('stops paging once the chosen option is complete', async () => {
		mockGetVoters.mockResolvedValue({
			ok: true,
			data: { items: [voter('klaus', 'o2'), voter('klaus', 'o2')], nextCursor: 'n1' },
		});
		render(<Harness />);
		fireEvent.click(screen.getByRole('button', { name: 'Spaces' }));
		expect(await screen.findAllByRole('link', { name: /klaus/ })).toHaveLength(1);
		expect(mockGetVoters).toHaveBeenCalledTimes(1);
	});

	it('says when the page cap leaves voters out', async () => {
		mockGetVoters.mockResolvedValue({ ok: true, data: { items: [], nextCursor: 'again' } });
		render(<Harness />);
		fireEvent.click(screen.getByRole('button', { name: 'Tabs' }));
		expect(await screen.findByText('Only the first 0 voters can be listed here.')).toBeInTheDocument();
		expect(mockGetVoters).toHaveBeenCalledTimes(MAX_VOTER_PAGES);
	});

	it('says when no voter of the option can be shown', async () => {
		mockGetVoters.mockResolvedValue({ ok: true, data: { items: [voter('mei', 'o1')], nextCursor: null } });
		render(<Harness />);
		fireEvent.click(screen.getByRole('button', { name: 'Spaces' }));
		expect(await screen.findByText('No one to show.')).toBeInTheDocument();
	});

	it('lists everyone who took part when the API withholds the choices', async () => {
		mockGetVoters.mockResolvedValue({
			ok: true,
			data: { items: [voter('mei', null), voter('klaus', null)], nextCursor: null },
		});
		render(<Harness />);
		fireEvent.click(screen.getByRole('button', { name: 'Tabs' }));
		expect(await screen.findByText(/choices are hidden/)).toBeInTheDocument();
		expect(within(screen.getByRole('list', { name: 'Who voted' })).getAllByRole('listitem')).toHaveLength(2);
	});

	it('explains when the list is hidden, without asking again', async () => {
		mockGetVoters.mockResolvedValue({ ok: false, status: 403, errorCode: 'vote.voters.hidden', message: 'no' });
		render(<Harness />);
		fireEvent.click(screen.getByRole('button', { name: 'Tabs' }));
		expect(await screen.findByText(/The voter list for this poll is hidden/)).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		fireEvent.click(screen.getByRole('button', { name: 'Spaces' }));
		expect(await screen.findByText(/The voter list for this poll is hidden/)).toBeInTheDocument();
		expect(mockGetVoters).toHaveBeenCalledTimes(1);
	});

	it('says when loading failed', async () => {
		mockGetVoters.mockResolvedValue({ ok: false, status: 500, message: 'down' });
		render(<Harness />);
		fireEvent.click(screen.getByRole('button', { name: 'Tabs' }));
		expect(await screen.findByText("Couldn’t load who voted.")).toBeInTheDocument();
	});
});
