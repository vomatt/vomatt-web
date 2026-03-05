import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PollCard } from '@/app/(frontend)/_components/PollCard';
import { Poll } from '@/types/poll';

// Mock next/link
jest.mock('next/link', () => {
	return function MockLink({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) {
		return <a href={href}>{children}</a>;
	};
});

const mockFetch = jest.fn(() =>
	Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
) as jest.Mock;

const basePoll: Poll = {
	id: 'poll-1',
	title: 'Best programming language?',
	description: 'Vote for your favourite',
	active: true,
	votingActive: true,
	allowMultipleChoices: false,
	anonymous: false,
	creatorId: 'user-1',
	creatorUsername: 'alice',
	createdAt: new Date(Date.now() - 60_000).toISOString(),
	updatedAt: new Date().toISOString(),
	startTime: new Date().toISOString(),
	endTime: null,
	totalVotes: 10,
	success: true,
	errorCode: null,
	options: [
		{ id: 'opt-1', text: 'TypeScript', votes: 7 },
		{ id: 'opt-2', text: 'Rust', votes: 3 },
	],
	comments: [],
};

beforeEach(() => {
	localStorage.clear();
	global.fetch = mockFetch;
	mockFetch.mockClear();
});

describe('PollCard', () => {
	it('renders the poll title', () => {
		render(<PollCard pollData={basePoll} />);
		expect(
			screen.getByText('Best programming language?')
		).toBeInTheDocument();
	});

	it('renders the poll description', () => {
		render(<PollCard pollData={basePoll} />);
		expect(screen.getByText('Vote for your favourite')).toBeInTheDocument();
	});

	it('renders creator username', () => {
		render(<PollCard pollData={basePoll} />);
		expect(screen.getByText('alice')).toBeInTheDocument();
	});

	it('renders all vote options before voting', () => {
		render(<PollCard pollData={basePoll} />);
		expect(screen.getByText('TypeScript')).toBeInTheDocument();
		expect(screen.getByText('Rust')).toBeInTheDocument();
	});

	it('does not show percentages before voting', () => {
		render(<PollCard pollData={basePoll} />);
		expect(screen.queryByText('70%')).not.toBeInTheDocument();
	});

	it('shows percentages after voting on an option', async () => {
		render(<PollCard pollData={basePoll} />);
		fireEvent.click(screen.getByText('TypeScript'));

		// After voting TypeScript: 8/11 votes = 73%, Rust: 3/11 = 27%
		// Use byText on the containing span via its text content
		await waitFor(() => {
			const spans = document.querySelectorAll('span.font-data');
			const texts = Array.from(spans).map((el) => el.textContent?.replace(/\s+/g, ''));
			expect(texts).toContain('73%');
			expect(texts).toContain('27%');
		});
	});

	it('saves the vote to localStorage', async () => {
		render(<PollCard pollData={basePoll} />);
		fireEvent.click(screen.getByText('TypeScript'));

		await waitFor(() => {
			const stored = JSON.parse(
				localStorage.getItem('vomatt_voted_polls') ?? '{}'
			);
			expect(stored['poll-1']).toBe('opt-1');
		});
	});

	it('calls the vote API after voting', async () => {
		render(<PollCard pollData={basePoll} />);
		fireEvent.click(screen.getByText('Rust'));

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				'/api/vote',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ pollId: 'poll-1', optionId: 'opt-2' }),
				})
			);
		});
	});

	it('prevents voting again once voted', async () => {
		render(<PollCard pollData={basePoll} />);
		fireEvent.click(screen.getByText('TypeScript'));

		// Wait for vote to register (vote buttons become divs)
		await waitFor(() => {
			expect(
				document.querySelector('button[class*="rounded-xl border"]')
			).not.toBeInTheDocument();
		});

		mockFetch.mockClear();
		// After voting, options are rendered as non-interactive divs — clicking has no effect
		fireEvent.click(screen.getByText('Rust'));
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it('restores vote state from localStorage on mount', async () => {
		localStorage.setItem(
			'vomatt_voted_polls',
			JSON.stringify({ 'poll-1': 'opt-1' })
		);

		render(<PollCard pollData={basePoll} />);

		await waitFor(() => {
			expect(screen.getByText('70%')).toBeInTheDocument();
		});
	});

	it('increments total vote count after voting', async () => {
		render(<PollCard pollData={basePoll} />);
		fireEvent.click(screen.getByText('TypeScript'));

		await waitFor(() => {
			expect(screen.getByText('11')).toBeInTheDocument();
		});
	});

	it('toggles comments section on button click', () => {
		const pollWithComment: Poll = {
			...basePoll,
			comments: [
				{
					id: 'c-1',
					author: 'bob',
					text: 'Great poll!',
					createdAt: new Date().toISOString(),
				},
			],
		};
		render(<PollCard pollData={pollWithComment} />);

		// Comments hidden initially
		expect(screen.queryByText('Great poll!')).not.toBeInTheDocument();

		fireEvent.click(screen.getByText('1 comment'));

		expect(screen.getByText('Great poll!')).toBeInTheDocument();
	});

	it('shows Ended badge for inactive polls', () => {
		const endedPoll: Poll = { ...basePoll, active: false, votingActive: false };
		render(<PollCard pollData={endedPoll} />);
		expect(screen.getByText('Ended')).toBeInTheDocument();
	});

	it('shows time-remaining badge for polls ending soon', () => {
		const soonPoll: Poll = {
			...basePoll,
			endTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString(), // 2 hours from now
		};
		render(<PollCard pollData={soonPoll} />);
		expect(screen.getByText(/Ends in \d+h/)).toBeInTheDocument();
	});
});
