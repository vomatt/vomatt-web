import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

// Mock poll API services
const mockCastVote = jest.fn();
const mockPostComment = jest.fn();
const mockGetMyVoteStatus = jest.fn();

jest.mock('@/lib/api/services/polls', () => ({
	vote: (...args: any[]) => mockCastVote(...args),
	postComment: (...args: any[]) => mockPostComment(...args),
	getMyVoteStatus: (...args: any[]) => mockGetMyVoteStatus(...args),
}));

// Mock AuthDialog
jest.mock('@/components/auth/AuthDialog', () => ({
	AuthDialog: ({ open, onAuthSuccess }: any) => {
		if (!open) return null;
		return (
			<div data-testid="auth-dialog">
				<button onClick={onAuthSuccess}>Mock Auth Success</button>
			</div>
		);
	},
}));

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
	jest.clearAllMocks();
	mockGetMyVoteStatus.mockRejectedValue(new Error('not authed'));
	mockCastVote.mockResolvedValue({});
	mockPostComment.mockResolvedValue({});
});

describe('PollCard', () => {
	it('renders the poll title', () => {
		render(<PollCard pollData={basePoll} />);
		expect(screen.getByText('Best programming language?')).toBeInTheDocument();
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

	it('shows percentages after voting when authenticated', async () => {
		render(<PollCard pollData={basePoll} isAuthenticated />);
		fireEvent.click(screen.getByText('TypeScript'));

		await waitFor(() => {
			const spans = document.querySelectorAll('span');
			const texts = Array.from(spans).map((el) =>
				el.textContent?.replace(/\s+/g, '')
			);
			expect(texts).toContain('73%');
			expect(texts).toContain('27%');
		});
	});

	it('calls the vote API when authenticated', async () => {
		render(<PollCard pollData={basePoll} isAuthenticated />);
		fireEvent.click(screen.getByText('Rust'));

		await waitFor(() => {
			expect(mockCastVote).toHaveBeenCalledWith('poll-1', ['opt-2']);
		});
	});

	it('prevents voting again once voted', async () => {
		render(<PollCard pollData={basePoll} isAuthenticated />);
		fireEvent.click(screen.getByText('TypeScript'));

		await waitFor(() => {
			expect(mockCastVote).toHaveBeenCalled();
		});

		mockCastVote.mockClear();
		fireEvent.click(screen.getByText('Rust'));
		expect(mockCastVote).not.toHaveBeenCalled();
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
			endTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
		};
		render(<PollCard pollData={soonPoll} />);
		expect(screen.getByText(/\d+h left/)).toBeInTheDocument();
	});
});

describe('PollCard auth dialog', () => {
	it('opens auth dialog when unauthenticated user clicks vote', async () => {
		render(<PollCard pollData={basePoll} isAuthenticated={false} />);
		fireEvent.click(screen.getByText('TypeScript'));

		await waitFor(() => {
			expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
		});
		expect(mockPush).not.toHaveBeenCalled();
	});

	it('does not open auth dialog when authenticated user votes', async () => {
		render(<PollCard pollData={basePoll} isAuthenticated />);
		fireEvent.click(screen.getByText('TypeScript'));

		await waitFor(() => {
			expect(mockCastVote).toHaveBeenCalled();
		});
		expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument();
	});

	it('replays pending vote after auth success', async () => {
		render(<PollCard pollData={basePoll} isAuthenticated={false} />);

		// Click vote — opens dialog
		fireEvent.click(screen.getByText('TypeScript'));
		await waitFor(() => {
			expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
		});

		// Simulate auth success
		fireEvent.click(screen.getByText('Mock Auth Success'));

		// Vote should be cast
		await waitFor(() => {
			expect(mockCastVote).toHaveBeenCalledWith('poll-1', ['opt-1']);
		});
	});

	it('opens auth dialog when unauthenticated user posts comment', async () => {
		render(<PollCard pollData={basePoll} isAuthenticated={false} />);

		// Open comments
		fireEvent.click(screen.getByText('0 comments'));

		// Type a comment and click Post
		fireEvent.change(screen.getByPlaceholderText('Add a comment…'), {
			target: { value: 'Hello' },
		});
		fireEvent.click(screen.getByText('Post'));

		await waitFor(() => {
			expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
		});
		expect(mockPush).not.toHaveBeenCalled();
	});

	it('closes auth dialog after auth success from comment flow', async () => {
		render(<PollCard pollData={basePoll} isAuthenticated={false} />);

		// Open comments and try to post
		fireEvent.click(screen.getByText('0 comments'));
		fireEvent.change(screen.getByPlaceholderText('Add a comment…'), {
			target: { value: 'Hello' },
		});
		fireEvent.click(screen.getByText('Post'));

		await waitFor(() => {
			expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
		});

		// Auth success
		fireEvent.click(screen.getByText('Mock Auth Success'));

		await waitFor(() => {
			expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument();
		});
	});
});
