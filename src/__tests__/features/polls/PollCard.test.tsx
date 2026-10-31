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

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));

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
const mockDeletePoll = jest.fn();
const mockGetVoters = jest.fn();
const mockBookmarkPoll = jest.fn();
const mockUnbookmarkPoll = jest.fn();
const mockReportPoll = jest.fn();

jest.mock('@/features/blocks/service', () => ({ blockUser: jest.fn() }));
jest.mock('@/features/polls/service', () => ({
	closePoll: (...args: any[]) => mockClosePoll(...args),
	deletePoll: (...args: any[]) => mockDeletePoll(...args),
	castBallot: (...args: any[]) => mockCastBallot(...args),
	retractBallot: (...args: any[]) => mockRetractBallot(...args),
	getMyBallot: (...args: any[]) => mockGetMyBallot(...args),
	getPoll: (...args: any[]) => mockGetPoll(...args),
	getResults: (...args: any[]) => mockGetResults(...args),
	postComment: (...args: any[]) => mockPostComment(...args),
	getComments: (...args: any[]) => mockGetComments(...args),
	getVoters: (...args: any[]) => mockGetVoters(...args),
	bookmarkPoll: (...args: any[]) => mockBookmarkPoll(...args),
	unbookmarkPoll: (...args: any[]) => mockUnbookmarkPoll(...args),
	reportPoll: (...args: any[]) => mockReportPoll(...args),
}));

// Exposes the layoutId that motion would use to fly the highlight between elements
jest.mock('@/features/polls/components/BallotMotion', () => ({
	...jest.requireActual('@/features/polls/components/BallotMotion'),
	SelectionHighlight: ({ layoutId }: { layoutId: string }) => (
		<span data-testid="selection-highlight" data-layout-id={layoutId} />
	),
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
		expect(screen.getAllByRole('radio')).toHaveLength(3);
	});

	it('names the creator by handle, with the poll\'s short age', () => {
		render(<PollCard poll={openPoll} />);
		expect(screen.getByRole('link', { name: /@mei\.lin/ })).toHaveAttribute('href', '/mei.lin');
		expect(screen.getByText('· 2h')).toBeInTheDocument();
	});

	it('shows Turnout and, beside Vote, that results are revealed at the end, but no Support', () => {
		render(<PollCard poll={openPoll} />);
		expect(screen.getByText('128 voted')).toBeInTheDocument();
		expect(screen.getByText('Results are revealed when the poll ends')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Vote' })).toBeInTheDocument();
		expect(screen.queryByText('Sealed. Thank you.')).not.toBeInTheDocument();
		expect(screen.queryByText(/%/)).not.toBeInTheDocument();
	});

	it('says under the hide-my-name checkbox who sees voters once the poll ends', () => {
		render(<PollCard poll={{ ...openPoll, voterVisibility: 'signed-in' }} viewerId="user-voter" />);
		expect(screen.getByRole('checkbox', { name: 'Hide my name from voter lists' })).toHaveAccessibleDescription(
			'After it ends, anyone signed in can see what you chose.'
		);
	});

	it('says a hidden voter is still counted once the box is checked', () => {
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		const box = screen.getByRole('checkbox', { name: 'Hide my name from voter lists' });
		fireEvent.click(box);
		expect(box).toHaveAccessibleDescription('You’re counted, but left out of the voter list.');
	});

	it('offers the hide-my-name checkbox before voting, set from the account default', () => {
		render(<PollCard poll={openPoll} viewerId="user-voter" anonymousByDefault />);
		const box = screen.getByRole('checkbox', { name: 'Hide my name from voter lists' });
		expect(box).toBeChecked();
		fireEvent.click(box);
		expect(box).not.toBeChecked();
		expect(mockCastBallot).not.toHaveBeenCalled();
	});

	it('toggles the checkbox from its text too, a full-height touch target', () => {
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		const label = screen.getByText('Hide my name from voter lists').closest('label')!;
		expect(label).toHaveClass('min-h-11');
		fireEvent.click(screen.getByText('After it ends, only the poll owner can see what you chose.'));
		expect(screen.getByRole('checkbox', { name: 'Hide my name from voter lists' })).toBeChecked();
	});

	it('sends the checked box with the first vote', () => {
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		fireEvent.click(screen.getByRole('checkbox', { name: 'Hide my name from voter lists' }));
		vote('Saturday');
		expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-sat', true);
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

		expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-sat', undefined);
		expect(screen.getByText('129 voted')).toBeInTheDocument();
		await waitFor(() => expect(screen.getByText(/Results are sealed until/)).toBeInTheDocument());
		expect(screen.getByLabelText('Saturday')).toBeChecked();
		// The Seal keeps the promise now, so the line beside Vote goes
		expect(screen.queryByText('Results are revealed when the poll ends')).not.toBeInTheDocument();
	});

	it('marks the card Voted once the viewer has a Ballot, and not before', async () => {
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		expect(screen.queryByText('Voted')).not.toBeInTheDocument();
		vote('Saturday');
		expect(await screen.findByText('Voted')).toBeInTheDocument();
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
		expect(screen.getByText('Voted')).toBeInTheDocument();
		expect(mockGetMyBallot).not.toHaveBeenCalled();
	});

	it('slides the highlight within one card but never to another card of the same poll', () => {
		const poll = { ...openPoll, myOptionId: 'opt-sun' };
		render(
			<>
				<PollCard poll={poll} viewerId="user-voter" />
				<PollCard poll={poll} viewerId="user-voter" />
			</>
		);
		const [first, second] = screen.getAllByTestId('selection-highlight');
		const firstId = first.getAttribute('data-layout-id');
		expect(firstId).not.toBe(second.getAttribute('data-layout-id'));

		fireEvent.click(screen.getAllByLabelText('Friday')[0]);
		expect(screen.getAllByTestId('selection-highlight')[0]).toHaveAttribute('data-layout-id', firstId);
	});

	it('raises the chosen option above the later ones, so the highlight slides over them', () => {
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-fri' }} viewerId="user-voter" />);
		expect(screen.getByLabelText('Friday').closest('label')).toHaveClass('z-10');
		expect(screen.getByLabelText('Saturday').closest('label')).not.toHaveClass('z-10');
	});

	it('keeps every option choosable after a vote is cast, with no pill on the rows', () => {
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun' }} viewerId="user-voter" />);
		expect(screen.getByLabelText('Friday')).toBeEnabled();
		expect(screen.queryByText('your vote')).not.toBeInTheDocument();
	});

	it('says in the Seal row whether the name is listed, beside Withdraw and Update vote', () => {
		render(
			<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun', myBallotAnonymous: false }} viewerId="user-voter" />
		);
		expect(screen.getByText('Sealed. Thank you.')).toBeInTheDocument();
		expect(screen.getByText('Your name shows in the voter list')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Hide my name' })).toBeInTheDocument();
		expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Withdraw vote' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Update vote' })).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /Change vote/ })).not.toBeInTheDocument();
	});

	it('replaces the Ballot without changing Turnout', async () => {
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun' }} viewerId="user-voter" />);
		fireEvent.click(screen.getByRole('button', { name: 'Update vote' }));
		expect(screen.getByText('Replaces your vote for Sunday. Still sealed until the poll ends.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Update vote' })).toBeDisabled();

		fireEvent.click(screen.getByLabelText(/Friday/));
		fireEvent.click(screen.getByRole('button', { name: 'Update vote' }));

		expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-fri');
		expect(screen.getByText('128 voted')).toBeInTheDocument();
		await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sealed. Thank you.'));
	});

	it('starts replacing the vote when another option is picked, and Cancel goes back', () => {
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun' }} viewerId="user-voter" />);
		fireEvent.click(screen.getByLabelText(/Friday/));
		expect(screen.getByText('Replaces your vote for Sunday. Still sealed until the poll ends.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Update vote' })).toBeEnabled();

		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(screen.getByLabelText(/Sunday/)).toBeChecked();
		expect(screen.getByRole('button', { name: 'Withdraw vote' })).toBeInTheDocument();
		expect(mockCastBallot).not.toHaveBeenCalled();
	});

	it('keeps the vote button busy, not greyed, while the Ballot is going in', async () => {
		let finish!: (value: unknown) => void;
		mockCastBallot.mockReturnValue(new Promise((resolve) => (finish = resolve)));
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Saturday');

		// The button the voter tapped is the one that shows the Ballot going in
		const voteButton = screen.getByRole('button', { name: /Vote/ });
		expect(voteButton).toHaveAttribute('aria-busy', 'true');
		expect(voteButton).not.toHaveAttribute('disabled');

		await act(async () => finish({ ok: true }));
		expect(screen.getByRole('button', { name: 'Update vote' })).not.toHaveAttribute('aria-busy');
	});

	it('marks Update vote busy while a changed vote is out', () => {
		mockCastBallot.mockReturnValue(new Promise(() => {}));
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun' }} viewerId="user-voter" />);
		fireEvent.click(screen.getByLabelText(/Friday/));
		fireEvent.click(screen.getByRole('button', { name: 'Update vote' }));
		expect(screen.getByRole('button', { name: /Update vote/ })).toHaveAttribute('aria-busy', 'true');
		// The option being replaced stays named while the new vote is out
		expect(screen.getByText('Replaces your vote for Sunday. Still sealed until the poll ends.')).toBeInTheDocument();
	});

	it('clears the busy state and rolls back when the vote request rejects', async () => {
		mockCastBallot.mockRejectedValue(new Error('network down'));
		const { container } = render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Saturday');
		expect(container.querySelector('[aria-busy]')).not.toBeNull();
		await waitFor(() => expect(container.querySelector('[aria-busy]')).toBeNull());
		// The vote is rolled back like any failed request
		expect(screen.getByRole('button', { name: 'Vote' })).toBeInTheDocument();
		expect(screen.getByText('128 voted')).toBeInTheDocument();
	});

	it('does not mark Vote busy while a withdrawal is out', async () => {
		mockRetractBallot.mockReturnValue(new Promise(() => {}));
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun' }} viewerId="user-voter" />);
		fireEvent.click(screen.getByRole('button', { name: 'Withdraw vote' }));
		fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));

		const voteButton = await screen.findByRole('button', { name: 'Vote' });
		expect(voteButton).not.toHaveAttribute('aria-busy');
		expect(voteButton).toBeDisabled();
	});

	it('asks before withdrawing, then returns to state A and lowers Turnout', async () => {
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun' }} viewerId="user-voter" />);

		fireEvent.click(screen.getByRole('button', { name: 'Withdraw vote' }));
		const confirm = screen.getByRole('group', { name: 'Withdraw your vote?' });
		expect(within(confirm).getByText('You won’t be counted or notified.')).toBeInTheDocument();
		expect(within(confirm).getByRole('button', { name: 'Keep' })).toHaveFocus();
		expect(mockRetractBallot).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));

		expect(mockRetractBallot).toHaveBeenCalledWith('poll-1');
		expect(screen.getByText('127 voted')).toBeInTheDocument();
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Vote' })).toBeInTheDocument()
		);
		// The pill lifts off with an exit animation
		await waitFor(() => expect(screen.queryByText('Voted')).not.toBeInTheDocument());
	});

	it('lets a voter hide an existing Ballot from the voter list', async () => {
		mockCastBallot.mockResolvedValue({
			ok: true,
			data: { ...openPoll, myOptionId: 'opt-sun', myBallotAnonymous: true },
		});
		render(
			<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun', myBallotAnonymous: false }} viewerId="user-voter" />
		);
		fireEvent.click(screen.getByRole('button', { name: 'Hide my name' }));
		expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-sun', true);
		expect(await screen.findByText('Your name is hidden from the voter list')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Show my name' })).toBeInTheDocument();
	});

	it('lets a hidden voter show their name again', () => {
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun', myBallotAnonymous: true }} viewerId="user-voter" />);
		fireEvent.click(screen.getByRole('button', { name: 'Show my name' }));
		expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-sun', false);
	});

	it('says nothing about names when nobody can see voters', () => {
		render(
			<PollCard
				poll={{ ...openPoll, myOptionId: 'opt-sun', myBallotAnonymous: false, voterVisibility: 'nobody' }}
				viewerId="user-voter"
			/>
		);
		expect(screen.queryByText('Your name shows in the voter list')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Hide my name' })).not.toBeInTheDocument();
	});

	it('Keep cancels the withdraw confirm', () => {
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun' }} viewerId="user-voter" />);
		fireEvent.click(screen.getByRole('button', { name: 'Withdraw vote' }));
		fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
		expect(screen.getByRole('button', { name: 'Update vote' })).toBeInTheDocument();
		expect(mockRetractBallot).not.toHaveBeenCalled();
	});

	it('shows the Seal in full once the cast is saved, instead of a toast', async () => {
		mockCastBallot.mockResolvedValue({ ok: true });
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Friday');

		await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sealed. Thank you.'));
		// The panel, besides the live region that reads it out
		expect(screen.getByText('Sealed. Thank you.', { selector: ':not([role=status])' })).toBeInTheDocument();
		expect(screen.getByText(/Results are sealed until/)).toBeInTheDocument();
		// Right after voting, the vote can still be withdrawn or changed
		expect(screen.getByRole('button', { name: 'Withdraw vote' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Update vote' })).toBeInTheDocument();
		expect(toast.success).not.toHaveBeenCalled();
	});

	it('keeps a vote cast here when the page refreshes, as the vote itself makes it do', async () => {
		const { rerender } = render(<PollCard poll={openPoll} viewerId="user-voter" isPage />);
		vote('Friday');
		await screen.findByRole('button', { name: 'Withdraw vote' });

		rerender(<PollCard poll={{ ...openPoll, commentCount: 1 }} viewerId="user-voter" isPage />);

		expect(screen.getByLabelText('Friday')).toBeChecked();
		expect(screen.getByRole('button', { name: 'Withdraw vote' })).toBeInTheDocument();
		expect(screen.getByText('129 voted')).toBeInTheDocument();
	});

	it('keeps a vote cast here when the poll is then saved', async () => {
		mockBookmarkPoll.mockResolvedValue({ ok: true });
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Friday');
		await screen.findByRole('button', { name: 'Withdraw vote' });

		fireEvent.click(screen.getByRole('button', { name: 'Save' }));
		await screen.findByRole('button', { name: 'Saved' });

		expect(screen.getByLabelText('Friday')).toBeChecked();
		expect(screen.getByText('129 voted')).toBeInTheDocument();
	});

	it('keeps a withdrawal made here when the page refreshes', async () => {
		const voted = { ...openPoll, myOptionId: 'opt-sun' };
		const { rerender } = render(<PollCard poll={voted} viewerId="user-voter" isPage />);
		fireEvent.click(screen.getByRole('button', { name: 'Withdraw vote' }));
		fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
		await screen.findByRole('button', { name: 'Vote' });

		rerender(<PollCard poll={{ ...voted, commentCount: 1 }} viewerId="user-voter" isPage />);

		expect(screen.getByLabelText('Sunday')).not.toBeChecked();
		expect(screen.getByRole('button', { name: 'Vote' })).toBeInTheDocument();
	});

	it('folds the Seal to a row on a later visit', () => {
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun' }} viewerId="user-voter" />);

		expect(screen.getByText('Sealed. Thank you.')).toBeInTheDocument();
		expect(screen.getByText(/^Results are sealed until .+\. We’ll notify you when they’re in\.$/)).toBeInTheDocument();
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
	});

	it('takes the Seal away and announces nothing once a vote is withdrawn', async () => {
		mockCastBallot.mockResolvedValue({ ok: true });
		mockRetractBallot.mockResolvedValue({ ok: true });
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Friday');
		await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sealed. Thank you.'));

		fireEvent.click(screen.getByRole('button', { name: 'Withdraw vote' }));
		fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));

		await waitFor(() => expect(screen.getByText('Results are revealed when the poll ends')).toBeInTheDocument());
		expect(screen.queryByText('Sealed. Thank you.')).not.toBeInTheDocument();
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
	});

	it('closes the Seal again when the cast fails', async () => {
		mockCastBallot.mockResolvedValue({ ok: false, status: 500, message: 'boom' });
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Friday');

		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		await waitFor(() => expect(screen.queryByText('Sealed. Thank you.')).not.toBeInTheDocument());
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
	});

	it('rolls back a failed cast', async () => {
		mockCastBallot.mockResolvedValue({ ok: false, status: 500, message: 'boom' });
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Friday');

		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		expect(toast.success).not.toHaveBeenCalled();
		expect(screen.getByText('128 voted')).toBeInTheDocument();
		await waitFor(() => expect(screen.queryByText('Voted')).not.toBeInTheDocument());
	});

	it('rolls back a failed withdraw', async () => {
		mockRetractBallot.mockResolvedValue({ ok: false, status: 500, message: 'boom' });
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun' }} viewerId="user-voter" />);
		fireEvent.click(screen.getByRole('button', { name: 'Withdraw vote' }));
		fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));

		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		expect(screen.getByText('128 voted')).toBeInTheDocument();
		expect(screen.getByText('Voted')).toBeInTheDocument();
		expect(screen.getByLabelText(/Sunday/)).toBeChecked();
	});

	it('on vote.ended, toasts and refetches so the card flips to state D', async () => {
		mockCastBallot.mockResolvedValue({ ok: false, errorCode: 'vote.ended', message: 'ended' });
		mockGetPoll.mockResolvedValue(endedPoll);
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Friday');

		await waitFor(() => expect(screen.getByText('48%')).toBeInTheDocument());
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

	it('offers Edit and Delete poll only to the owner', () => {
		const { unmount } = render(<PollCard poll={scheduled} viewerId="user-voter" />);
		expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Delete poll' })).not.toBeInTheDocument();
		unmount();

		render(<PollCard poll={scheduled} viewerId="user-1" />);
		expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Delete poll' })).toBeInTheDocument();
		// A Scheduled Poll is Deleted, never Ended
		expect(screen.queryByRole('button', { name: 'End now' })).not.toBeInTheDocument();
	});

	it('does not offer Edit on an Open Poll, even to the owner', () => {
		render(<PollCard poll={openPoll} viewerId="user-1" />);
		expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
	});

	it('deletes after confirming, and the card leaves the list', async () => {
		mockDeletePoll.mockResolvedValue({ ok: true });
		render(<PollCard poll={scheduled} viewerId="user-1" />);

		fireEvent.click(screen.getByRole('button', { name: 'Delete poll' }));
		expect(screen.getByText(/No one is notified/)).toBeInTheDocument();
		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete poll' }));

		await waitFor(() => expect(mockDeletePoll).toHaveBeenCalledWith('poll-1'));
		await waitFor(() => expect(screen.queryByText(scheduled.title)).not.toBeInTheDocument());
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('leaves the Poll\'s own page once it is deleted', async () => {
		mockDeletePoll.mockResolvedValue({ ok: true });
		render(<PollCard poll={scheduled} viewerId="user-1" deletedHref="/my-polls" />);
		fireEvent.click(screen.getByRole('button', { name: 'Delete poll' }));
		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete poll' }));
		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/my-polls'));
	});

	it('shows the API\'s reason when the delete window has passed', async () => {
		mockDeletePoll.mockResolvedValue({
			ok: false,
			errorCode: 'vote.delete.window_passed',
			message: 'Too late to delete',
		});
		render(<PollCard poll={{ ...openPoll, deletable: true }} viewerId="user-1" />);
		fireEvent.click(screen.getByRole('button', { name: 'Delete poll' }));
		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete poll' }));
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Too late to delete'));
		expect(screen.getByRole('heading', { name: openPoll.title })).toBeInTheDocument();
	});
});

describe('PollCard owner of an Open Poll', () => {
	it('offers no End now on a Public Poll, which runs to its Deadline', () => {
		render(<PollCard poll={{ ...openPoll, audience: 'public', deletable: false }} viewerId="user-1" />);
		expect(screen.queryByRole('button', { name: 'End now' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Delete poll' })).not.toBeInTheDocument();
	});

	it('offers Delete within the delete window', () => {
		render(<PollCard poll={{ ...openPoll, audience: 'public', deletable: true }} viewerId="user-1" />);
		expect(screen.getByRole('button', { name: 'Delete poll' })).toBeInTheDocument();
	});

	it('ends an Unlisted Poll now and shows the results', async () => {
		mockClosePoll.mockResolvedValue({ ok: true });
		mockGetPoll.mockResolvedValue({ ...endedPoll, audience: 'unlisted' });
		render(<PollCard poll={{ ...openPoll, audience: 'unlisted' }} viewerId="user-1" />);

		fireEvent.click(screen.getByRole('button', { name: 'End now' }));
		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'End now' }));

		await waitFor(() => expect(mockClosePoll).toHaveBeenCalledWith('poll-1'));
		await waitFor(() => expect(screen.getByText('48%')).toBeInTheDocument());
	});

	it('offers Invitees and End now on an Invite-only Poll', () => {
		render(<PollCard poll={{ ...openPoll, audience: 'invite-only' }} viewerId="user-1" />);
		expect(screen.getByRole('button', { name: 'Invitees' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'End now' })).toBeInTheDocument();
	});

	it('offers nothing to anyone else', () => {
		render(<PollCard poll={{ ...openPoll, audience: 'unlisted', deletable: null }} viewerId="user-voter" />);
		expect(screen.queryByRole('button', { name: 'End now' })).not.toBeInTheDocument();
	});
});

describe('PollCard Audience', () => {
	it('marks an Invite-only Poll after its Turnout, and says Voter Visibility covers the Invitees', () => {
		render(
			<PollCard
				poll={{ ...openPoll, audience: 'invite-only', voterVisibility: 'signed-in' }}
				viewerId="user-voter"
			/>
		);
		expect(screen.getByText('128 voted · invite only')).toBeInTheDocument();
		expect(screen.getByText('After it ends, everyone invited can see what you chose.')).toBeInTheDocument();
	});

	it('marks an Unlisted Poll after its Turnout', () => {
		render(<PollCard poll={{ ...openPoll, audience: 'unlisted' }} viewerId="user-voter" />);
		expect(screen.getByText('128 voted · unlisted')).toBeInTheDocument();
	});

	it('says nothing for a Public Poll', () => {
		render(<PollCard poll={{ ...openPoll, audience: 'public' }} viewerId="user-voter" />);
		expect(screen.getByText('128 voted')).toBeInTheDocument();
		expect(screen.queryByText(/public/i)).not.toBeInTheDocument();
	});

	it('switches to the results when the last Invitee\'s Ballot ends the Poll', async () => {
		const poll: Poll = { ...openPoll, audience: 'invite-only' };
		const ended = { ...endedPoll, audience: 'invite-only' as const, endTime: iso(-1000) };
		mockCastBallot.mockResolvedValue({ ok: true, data: ended });
		render(<PollCard poll={poll} viewerId="user-voter" />);

		fireEvent.click(screen.getByRole('radio', { name: 'Sunday' }));
		fireEvent.click(screen.getByRole('button', { name: 'Vote' }));

		await waitFor(() => expect(screen.getByText('48%')).toBeInTheDocument());
		// The Ballot's response already is the Ended Poll
		expect(mockGetPoll).not.toHaveBeenCalled();
	});
});

describe('PollCard state D · Ended', () => {
	it('shows Support per option, the winner and the viewer’s choice, without raw counts', () => {
		render(<PollCard poll={{ ...endedPoll, myOptionId: 'opt-sat' }} viewerId="user-voter" />);
		expect(screen.getByText('29%')).toBeInTheDocument();
		expect(screen.getByText('22%')).toBeInTheDocument();
		expect(screen.getByText('48%')).toBeInTheDocument();
		expect(screen.getByText('your vote')).toBeInTheDocument();
		expect(screen.queryByText('62')).not.toBeInTheDocument();
		expect(within(screen.getByText('Sunday').closest('li')!).getByRole('img', { name: 'Elected' })).toBeInTheDocument();
		expect(screen.getAllByRole('img', { name: 'Elected' })).toHaveLength(1);
		expect(screen.getByText('“Saturday” was your vote.')).toBeInTheDocument();
		expect(screen.queryByRole('radio')).not.toBeInTheDocument();
	});

	it('tells a viewer who didn’t vote how many people decided', () => {
		render(<PollCard poll={endedPoll} viewerId="user-voter" />);
		expect(screen.getByText('“Sunday” won. 129 people decided this.')).toBeInTheDocument();
		expect(screen.queryByText('your vote')).not.toBeInTheDocument();
	});

	it('says one person in the singular', () => {
		const single: Poll = {
			...endedPoll,
			participantCount: 1,
			options: endedPoll.options.map((o) => ({ ...o, votes: o.id === 'opt-fri' ? 1 : 0 })),
		};
		render(<PollCard poll={single} />);
		expect(screen.getByText('“Friday” won. 1 person decided this.')).toBeInTheDocument();
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

	it('lets the owner open who chose an option', async () => {
		mockGetVoters.mockResolvedValue({
			ok: true,
			data: {
				items: [{ userId: 'u2', username: 'klaus', optionId: 'opt-sun', votedAt: iso(-2 * HOUR) }],
				nextCursor: null,
			},
		});
		render(<PollCard poll={endedPoll} viewerId="user-1" />);
		fireEvent.click(screen.getByRole('button', { name: /Sunday/ }));
		const dialog = await screen.findByRole('dialog');
		expect(within(dialog).getByText('62 voted')).toBeInTheDocument();
		expect(await within(dialog).findByRole('link', { name: /klaus/ })).toBeInTheDocument();
	});

	it('keeps options plain when Voter Visibility hides voters from the viewer', () => {
		render(<PollCard poll={endedPoll} viewerId="user-voter" />);
		expect(screen.queryByRole('button', { name: /Sunday/ })).not.toBeInTheDocument();
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
		expect(await screen.findByText("Couldn’t load the results.")).toBeInTheDocument();
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

		expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-sun', undefined);
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

		await waitFor(() => expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-sun', undefined));
		expect(screen.getByText('128 voted')).toBeInTheDocument();
		expect(screen.getByLabelText(/Sunday/)).toBeChecked();
	});

	it('does not open sign-in for a signed-in voter', () => {
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Sunday');
		expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument();
	});

	it('links the title to the poll page from a list, but not on the page itself', () => {
		const { unmount } = render(<PollCard poll={openPoll} />);
		expect(screen.getByRole('link', { name: openPoll.title })).toHaveAttribute('href', '/poll/poll-1');
		unmount();

		render(<PollCard poll={openPoll} headingLevel="h1" isPage />);
		expect(screen.queryByRole('link', { name: openPoll.title })).not.toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 1, name: openPoll.title })).toBeInTheDocument();
	});

	it('saves a poll at once and puts it back when the request fails', async () => {
		mockBookmarkPoll.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: false, message: 'x' });
		mockUnbookmarkPoll.mockResolvedValue({ ok: false, message: 'x' });
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		fireEvent.click(screen.getByRole('button', { name: 'Save' }));
		expect(await screen.findByRole('button', { name: 'Saved' })).toHaveAttribute('aria-pressed', 'true');
		expect(mockBookmarkPoll).toHaveBeenCalledWith('poll-1');

		fireEvent.click(screen.getByRole('button', { name: 'Saved' }));
		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument();
		expect(mockUnbookmarkPoll).toHaveBeenCalledWith('poll-1');
	});

	it('asks a guest to sign in before saving', () => {
		render(<PollCard poll={openPoll} />);
		fireEvent.click(screen.getByRole('button', { name: 'Save' }));
		expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
		expect(mockBookmarkPoll).not.toHaveBeenCalled();
	});

	it('offers Report to everyone but the owner', () => {
		const { unmount } = render(<PollCard poll={openPoll} viewerId="user-1" />);
		expect(screen.queryByRole('button', { name: 'More options' })).not.toBeInTheDocument();
		unmount();
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
	});

	it('leads Comments down to the discussion on the poll page', () => {
		render(<PollCard poll={{ ...openPoll, commentCount: 3 }} isPage />);
		expect(screen.getByRole('link', { name: '3 comments' })).toHaveAttribute('href', '#discussion');
		expect(mockGetComments).not.toHaveBeenCalled();
	});

	it('leads from a feed card to the poll page discussion instead of unfolding it', () => {
		render(<PollCard poll={{ ...openPoll, commentCount: 3 }} />);
		const link = screen.getByRole('link', { name: '3 comments' });
		expect(link).toHaveAttribute('href', '/poll/poll-1#discussion');
		expect(mockGetComments).not.toHaveBeenCalled();
		expect(screen.queryByPlaceholderText('Why did you vote the way you did?')).not.toBeInTheDocument();
	});

	it('shows the comment count from a refreshed poll, as after posting on the poll page', () => {
		const { rerender } = render(<PollCard poll={{ ...openPoll, commentCount: 0 }} isPage />);
		rerender(<PollCard poll={{ ...openPoll, commentCount: 1 }} isPage />);
		expect(screen.getByRole('link', { name: '1 comment' })).toBeInTheDocument();
	});

});
