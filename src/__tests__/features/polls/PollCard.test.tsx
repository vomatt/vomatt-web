import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';

import { PollCard } from '@/features/polls/components/PollCard';
import { Poll } from '@/features/polls/schema';

jest.mock('next/link', () => {
	return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
		return <a href={href}>{children}</a>;
	};
});

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

jest.mock('sonner', () => {
	const toast = Object.assign(jest.fn(), { error: jest.fn(), success: jest.fn() });
	return { toast };
});

const mockCastBallot = jest.fn();
const mockRetractBallot = jest.fn();
const mockGetMyBallot = jest.fn();
const mockGetPoll = jest.fn();
const mockGetResults = jest.fn();
const mockPostComment = jest.fn();
const mockGetComments = jest.fn();
const mockClosePoll = jest.fn();

jest.mock('@/features/polls/service', () => ({
	closePoll: (...args: any[]) => mockClosePoll(...args),
	castBallot: (...args: any[]) => mockCastBallot(...args),
	retractBallot: (...args: any[]) => mockRetractBallot(...args),
	getMyBallot: (...args: any[]) => mockGetMyBallot(...args),
	getPoll: (...args: any[]) => mockGetPoll(...args),
	getResults: (...args: any[]) => mockGetResults(...args),
	postComment: (...args: any[]) => mockPostComment(...args),
	getComments: (...args: any[]) => mockGetComments(...args),
}));

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

const HOUR = 3600_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();

/** State A: Open, sealed shape (no counts), no Ballot. */
const openPoll: Poll = {
	id: 'poll-1',
	title: 'Which day should the meetup run?',
	description: 'The day with the most votes wins.',
	active: true,
	votingActive: true,
	creatorId: 'user-1',
	creatorUsername: 'mei.lin',
	createdAt: iso(-2 * HOUR),
	startTime: iso(-2 * HOUR),
	endTime: iso(72 * HOUR),
	participantCount: 128,
	myOptionId: null,
	voterVisibility: 'owner',
	options: [
		{ id: 'opt-fri', text: 'Friday' },
		{ id: 'opt-sat', text: 'Saturday' },
		{ id: 'opt-sun', text: 'Sunday' },
	],
};

const endedPoll: Poll = {
	...openPoll,
	active: false,
	votingActive: false,
	endTime: iso(-HOUR),
	participantCount: 129,
	options: [
		{ id: 'opt-fri', text: 'Friday', votes: 38 },
		{ id: 'opt-sat', text: 'Saturday', votes: 29 },
		{ id: 'opt-sun', text: 'Sunday', votes: 62 },
	],
};

const vote = (option: string) => {
	fireEvent.click(screen.getByLabelText(option));
	fireEvent.click(screen.getByRole('button', { name: 'Vote' }));
};

beforeEach(() => {
	jest.clearAllMocks();
	mockCastBallot.mockResolvedValue({ ok: true });
	mockRetractBallot.mockResolvedValue({ ok: true });
	mockGetMyBallot.mockResolvedValue(null);
	mockGetPoll.mockResolvedValue(null);
	mockPostComment.mockResolvedValue({});
});

describe('PollCard state A · Open, no Ballot', () => {
	it('renders the question, description, creator and options', () => {
		render(<PollCard poll={openPoll} />);
		expect(
			screen.getByRole('heading', { name: 'Which day should the meetup run?' })
		).toBeInTheDocument();
		expect(screen.getByText('The day with the most votes wins.')).toBeInTheDocument();
		expect(screen.getByText('mei.lin')).toBeInTheDocument();
		expect(screen.getAllByRole('radio')).toHaveLength(3);
	});

	it('shows Turnout, the visibility line and the reveal hint, but no Support', () => {
		render(<PollCard poll={openPoll} />);
		expect(screen.getByText('128 voted')).toBeInTheDocument();
		expect(
			screen.getByText('After it ends, only the poll owner can see what you chose.')
		).toBeInTheDocument();
		expect(screen.getByText('Results are revealed when the poll ends')).toBeInTheDocument();
		expect(screen.queryByText(/%/)).not.toBeInTheDocument();
	});

	it('keeps Support sealed even when the API still sends counts', () => {
		const withCounts: Poll = {
			...openPoll,
			options: openPoll.options.map((o) => ({ ...o, votes: 10 })),
		};
		render(<PollCard poll={withCounts} viewerId="user-voter" />);
		vote('Friday');
		expect(screen.queryByText(/%/)).not.toBeInTheDocument();
	});

	it('disables Vote until an option is selected', () => {
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		expect(screen.getByRole('button', { name: 'Vote' })).toBeDisabled();
		fireEvent.click(screen.getByLabelText('Friday'));
		expect(screen.getByRole('button', { name: 'Vote' })).toBeEnabled();
	});
});

describe('PollCard state B · Open, has Ballot', () => {
	it('casts the selected option and raises Turnout', async () => {
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Saturday');

		expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-sat');
		expect(screen.getByText('129 voted')).toBeInTheDocument();
		await waitFor(() => expect(screen.getByText('Your vote')).toBeInTheDocument());
		expect(screen.getByText(/Results are sealed until/)).toBeInTheDocument();
	});

	it('shows a returning voter their choice from the status call', async () => {
		mockGetMyBallot.mockResolvedValue('opt-sun');
		const { myOptionId, ...withoutField } = openPoll;
		render(<PollCard poll={withoutField} viewerId="user-voter" />);

		await waitFor(() => expect(screen.getByLabelText(/Sunday/)).toBeChecked());
		expect(mockGetMyBallot).toHaveBeenCalledWith('poll-1');
	});

	it('uses myOptionId from the Poll without the status call', () => {
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun' }} viewerId="user-voter" />);
		expect(screen.getByLabelText(/Sunday/)).toBeChecked();
		expect(screen.getByText('Your vote')).toBeInTheDocument();
		expect(mockGetMyBallot).not.toHaveBeenCalled();
	});

	it('replaces the Ballot without changing Turnout', async () => {
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun' }} viewerId="user-voter" />);
		const update = screen.getByRole('button', { name: 'Update vote' });
		expect(update).toBeDisabled();

		fireEvent.click(screen.getByLabelText(/Friday/));
		fireEvent.click(update);

		expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-fri');
		expect(screen.getByText('128 voted')).toBeInTheDocument();
	});

	it('asks before withdrawing, then returns to state A and lowers Turnout', async () => {
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun' }} viewerId="user-voter" />);

		fireEvent.click(screen.getByRole('button', { name: 'Withdraw vote' }));
		expect(
			screen.getByText("Withdraw your vote? You won't be counted or notified.")
		).toBeInTheDocument();
		expect(mockRetractBallot).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));

		expect(mockRetractBallot).toHaveBeenCalledWith('poll-1', 'opt-sun');
		expect(screen.getByText('127 voted')).toBeInTheDocument();
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Vote' })).toBeInTheDocument()
		);
		// The stamp lifts off with an exit animation
		await waitFor(() => expect(screen.queryByText('Your vote')).not.toBeInTheDocument());
	});

	it('Keep cancels the withdraw confirm', () => {
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun' }} viewerId="user-voter" />);
		fireEvent.click(screen.getByRole('button', { name: 'Withdraw vote' }));
		fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
		expect(screen.getByRole('button', { name: 'Update vote' })).toBeInTheDocument();
		expect(mockRetractBallot).not.toHaveBeenCalled();
	});

	it('toasts a success once the cast is saved', async () => {
		mockCastBallot.mockResolvedValue({ ok: true });
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Friday');

		await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Vote cast.', expect.anything()));
	});

	it('rolls back a failed cast', async () => {
		mockCastBallot.mockResolvedValue({ ok: false, status: 500, message: 'boom' });
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Friday');

		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		expect(screen.getByText('128 voted')).toBeInTheDocument();
		await waitFor(() => expect(screen.queryByText('Your vote')).not.toBeInTheDocument());
	});

	it('rolls back a failed withdraw', async () => {
		mockRetractBallot.mockResolvedValue({ ok: false, status: 500, message: 'boom' });
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun' }} viewerId="user-voter" />);
		fireEvent.click(screen.getByRole('button', { name: 'Withdraw vote' }));
		fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));

		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		expect(screen.getByText('128 voted')).toBeInTheDocument();
		expect(screen.getByText('Your vote')).toBeInTheDocument();
	});

	it('on vote.ended, toasts and refetches so the card flips to state D', async () => {
		mockCastBallot.mockResolvedValue({ ok: false, errorCode: 'vote.ended', message: 'ended' });
		mockGetPoll.mockResolvedValue(endedPoll);
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Friday');

		await waitFor(() => expect(screen.getByText('62')).toBeInTheDocument());
		expect(toast).toHaveBeenCalledWith('This poll just ended.');
		expect(mockGetPoll).toHaveBeenCalledWith('poll-1');
		expect(screen.queryByRole('radio')).not.toBeInTheDocument();
	});
});

describe('PollCard state C · Scheduled', () => {
	const scheduled: Poll = {
		...openPoll,
		votingActive: false,
		startTime: iso(48 * HOUR),
	};

	it('disables the options and shows when voting opens', () => {
		render(<PollCard poll={scheduled} viewerId="user-voter" />);
		screen.getAllByRole('radio').forEach((radio) => expect(radio).toBeDisabled());
		expect(screen.getByText(/Voting opens in/)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Vote' })).not.toBeInTheDocument();
	});

	it('offers Edit and Cancel poll only to the owner', () => {
		const { unmount } = render(<PollCard poll={scheduled} viewerId="user-voter" />);
		expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Cancel poll' })).not.toBeInTheDocument();
		unmount();

		render(<PollCard poll={scheduled} viewerId="user-1" />);
		expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Cancel poll' })).toBeInTheDocument();
	});

	it('does not offer Edit on an Open Poll, even to the owner', () => {
		render(<PollCard poll={openPoll} viewerId="user-1" />);
		expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
	});

	it('cancels after confirming that no one will be notified', async () => {
		mockClosePoll.mockResolvedValue({ ok: true });
		mockGetPoll.mockResolvedValue({ ...scheduled, active: false });
		mockGetResults.mockResolvedValue({
			ok: true,
			data: {
				id: 'poll-1',
				options: scheduled.options.map(({ id, text }) => ({ id, text, voteCount: 0 })),
			},
		});
		render(<PollCard poll={scheduled} viewerId="user-1" />);

		fireEvent.click(screen.getByRole('button', { name: 'Cancel poll' }));
		expect(screen.getByText("It won't open, and no one will be notified.")).toBeInTheDocument();
		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel poll' }));

		await waitFor(() => expect(mockClosePoll).toHaveBeenCalledWith('poll-1'));
		await waitFor(() => expect(screen.getByText('No votes were cast')).toBeInTheDocument());
	});
});

describe('PollCard state D · Ended', () => {
	it('shows Support per option, the winner and the viewer’s choice', () => {
		render(<PollCard poll={{ ...endedPoll, myOptionId: 'opt-sat' }} viewerId="user-voter" />);
		expect(screen.getByText('29%')).toBeInTheDocument();
		expect(screen.getByText('22%')).toBeInTheDocument();
		expect(screen.getByText('48%')).toBeInTheDocument();
		expect(screen.getByText('your vote')).toBeInTheDocument();
		expect(
			screen.getByText('Sunday won · Support is the share of 129 participants')
		).toBeInTheDocument();
		expect(screen.queryByRole('radio')).not.toBeInTheDocument();
	});

	it('names every tied option', () => {
		const tied: Poll = {
			...endedPoll,
			participantCount: 4,
			options: [
				{ id: 'a', text: 'Tabs', votes: 2 },
				{ id: 'b', text: 'Spaces', votes: 2 },
			],
		};
		render(<PollCard poll={tied} />);
		expect(screen.getByText('Tie between Tabs and Spaces')).toBeInTheDocument();
	});

	it('says when no votes were cast', () => {
		const empty: Poll = {
			...endedPoll,
			participantCount: 0,
			options: endedPoll.options.map((o) => ({ ...o, votes: 0 })),
		};
		render(<PollCard poll={empty} />);
		expect(screen.getByText('No votes were cast')).toBeInTheDocument();
	});

	it('loads results when the Poll comes without counts', async () => {
		mockGetResults.mockResolvedValue({
			ok: true,
			data: {
				id: 'poll-1',
				totalParticipants: 2,
				options: [
					{ id: 'opt-fri', text: 'Friday', voteCount: 2 },
					{ id: 'opt-sat', text: 'Saturday', voteCount: 0 },
					{ id: 'opt-sun', text: 'Sunday', voteCount: 0 },
				],
			},
		});
		const { participantCount, ...sealedEnded } = { ...endedPoll, options: openPoll.options };
		render(<PollCard poll={sealedEnded} />);

		await waitFor(() => expect(screen.getByText('100%')).toBeInTheDocument());
		expect(mockGetResults).toHaveBeenCalledWith('poll-1');
	});

	it('refetches the Poll when results are still sealed, then stops loading', async () => {
		mockGetResults.mockResolvedValue({ ok: false, status: 403, message: 'sealed' });
		render(<PollCard poll={{ ...endedPoll, options: openPoll.options }} />);
		await waitFor(() => expect(mockGetPoll).toHaveBeenCalledWith('poll-1'));
		expect(await screen.findByText("Couldn't load the results.")).toBeInTheDocument();
	});
});

describe('PollCard signed-out visitor', () => {
	it('opens sign-in on Vote, then casts the chosen option', async () => {
		render(<PollCard poll={openPoll} />);
		vote('Sunday');

		expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
		expect(mockCastBallot).not.toHaveBeenCalled();

		await act(async () => {
			fireEvent.click(screen.getByText('Mock Auth Success'));
		});

		expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-sun');
		expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument();
	});

	it('after sign-in, counts Turnout against a Ballot cast elsewhere and keeps the new vote', async () => {
		let answerLookup: (optionId: string) => void = () => {};
		mockGetMyBallot.mockReturnValue(new Promise((resolve) => (answerLookup = resolve)));
		const { myOptionId, ...withoutField } = openPoll;
		render(<PollCard poll={withoutField} />);
		vote('Sunday');
		await act(async () => {
			fireEvent.click(screen.getByText('Mock Auth Success'));
		});

		// The viewer had already voted Friday on another device
		await act(async () => answerLookup('opt-fri'));

		await waitFor(() => expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-sun'));
		expect(screen.getByText('128 voted')).toBeInTheDocument();
		expect(screen.getByLabelText(/Sunday/)).toBeChecked();
	});

	it('does not open sign-in for a signed-in voter', () => {
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Sunday');
		expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument();
	});

	it('opens sign-in on posting a comment, then posts it', async () => {
		mockGetComments.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null, total: 0 } });
		mockPostComment.mockResolvedValue({
			ok: true,
			data: { id: 'c1', author: 'voter', text: 'Hello', createdAt: '2026-10-05T00:00:00Z' },
		});
		render(<PollCard poll={openPoll} />);
		fireEvent.click(screen.getByText('Discuss'));
		fireEvent.change(await screen.findByPlaceholderText('Why did you vote the way you did?'), {
			target: { value: 'Hello' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Post' }));

		expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
		await act(async () => {
			fireEvent.click(screen.getByText('Mock Auth Success'));
		});
		expect(mockPostComment).toHaveBeenCalledWith('poll-1', 'Hello');
		expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument();
		expect(await screen.findByText('Hello')).toBeInTheDocument();
		expect(screen.getByText('1 comment')).toBeInTheDocument();
	});

	it('asks a guest to sign in when the API keeps comments to members, then loads them', async () => {
		mockGetComments.mockResolvedValueOnce({ ok: false, status: 401, message: 'Unauthorized' });
		mockGetComments.mockResolvedValueOnce({
			ok: true,
			data: {
				items: [{ id: 'c1', author: 'mei', text: 'Saturday works', createdAt: '2026-10-05T00:00:00Z' }],
				nextCursor: null,
				total: 1,
			},
		});
		render(<PollCard poll={openPoll} />);
		fireEvent.click(screen.getByText('Discuss'));

		fireEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
		await act(async () => {
			fireEvent.click(screen.getByText('Mock Auth Success'));
		});
		expect(await screen.findByText('Saturday works')).toBeInTheDocument();
	});

	it('keeps the comment text when the guest backs out of sign-in', async () => {
		mockGetComments.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null, total: 0 } });
		render(<PollCard poll={openPoll} />);
		fireEvent.click(screen.getByText('Discuss'));
		const box = await screen.findByPlaceholderText('Why did you vote the way you did?');
		fireEvent.change(box, { target: { value: 'Draft' } });
		fireEvent.click(screen.getByRole('button', { name: 'Post' }));

		expect(mockPostComment).not.toHaveBeenCalled();
		expect(box).toHaveValue('Draft');
	});
});
