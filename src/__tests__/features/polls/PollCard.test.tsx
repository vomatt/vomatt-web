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

// Base UI's Switch dispatches a PointerEvent on click
window.PointerEvent = window.PointerEvent || (MouseEvent as any);

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
		expect(
			screen.getByText('After it ends, only the poll owner can see what you chose.')
		).toBeInTheDocument();
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

		expect(mockRetractBallot).toHaveBeenCalledWith('poll-1');
		expect(screen.getByText('127 voted')).toBeInTheDocument();
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Vote' })).toBeInTheDocument()
		);
		// The stamp lifts off with an exit animation
		await waitFor(() => expect(screen.queryByText('Your vote')).not.toBeInTheDocument());
	});

	it('lets a voter hide an existing Ballot from the voter list', async () => {
		mockCastBallot.mockResolvedValue({
			ok: true,
			data: { ...openPoll, myOptionId: 'opt-sun', myBallotAnonymous: true },
		});
		render(
			<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun', myBallotAnonymous: false }} viewerId="user-voter" />
		);
		const toggle = screen.getByRole('switch', { name: 'Hide my name from voter lists' });
		fireEvent.click(toggle);
		expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-sun', true);
		await waitFor(() => expect(toggle).toBeChecked());
	});

	it('toggles anonymity from its label too, a full-height touch target', () => {
		mockCastBallot.mockResolvedValue({ ok: true, data: { ...openPoll, myOptionId: 'opt-sun', myBallotAnonymous: true } });
		render(<PollCard poll={{ ...openPoll, myOptionId: 'opt-sun', myBallotAnonymous: false }} viewerId="user-voter" />);
		const label = screen.getByText('Hide my name from voter lists');
		expect(label).toHaveClass('min-h-11');
		fireEvent.click(label);
		expect(mockCastBallot).toHaveBeenCalledWith('poll-1', 'opt-sun', true);
	});

	it('offers no anonymity switch when nobody can see voters', () => {
		render(
			<PollCard
				poll={{ ...openPoll, myOptionId: 'opt-sun', myBallotAnonymous: false, voterVisibility: 'nobody' }}
				viewerId="user-voter"
			/>
		);
		expect(screen.queryByRole('switch')).not.toBeInTheDocument();
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

		await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Vote cast.'));
	});

	it('rolls back a failed cast', async () => {
		mockCastBallot.mockResolvedValue({ ok: false, status: 500, message: 'boom' });
		render(<PollCard poll={openPoll} viewerId="user-voter" />);
		vote('Friday');

		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		expect(toast.success).not.toHaveBeenCalled();
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
	it('marks an Invite-only Poll, and says Voter Visibility covers the Invitees', () => {
		render(
			<PollCard
				poll={{ ...openPoll, audience: 'invite-only', voterVisibility: 'signed-in' }}
				viewerId="user-voter"
			/>
		);
		expect(screen.getByText('Invite only')).toBeInTheDocument();
		expect(
			screen.getByText('After it ends, everyone invited can see what you chose.')
		).toBeInTheDocument();
	});

	it('says nothing for a Public Poll', () => {
		render(<PollCard poll={{ ...openPoll, audience: 'public' }} viewerId="user-voter" />);
		expect(screen.queryByText('Public')).not.toBeInTheDocument();
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
	it('shows Support per option, the winner and the viewer’s choice', () => {
		render(<PollCard poll={{ ...endedPoll, myOptionId: 'opt-sat' }} viewerId="user-voter" />);
		expect(screen.getByText('29%')).toBeInTheDocument();
		expect(screen.getByText('22%')).toBeInTheDocument();
		expect(screen.getByText('48%')).toBeInTheDocument();
		expect(screen.getByText('your vote')).toBeInTheDocument();
		expect(
			screen.getByText('Sunday won. Support is the share of 129 participants')
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
		mockGetComments.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
		mockPostComment.mockResolvedValue({
			ok: true,
			data: { id: 'c1', author: 'voter', text: 'Hello', createdAt: '2026-10-05T00:00:00Z' },
		});
		render(<PollCard poll={{ ...openPoll, commentCount: 0 }} />);
		fireEvent.click(screen.getByText('0 comments'));
		fireEvent.change(await screen.findByPlaceholderText('Why did you vote the way you did?'), {
			target: { value: 'Hello' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Post' }));

		expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
		await act(async () => {
			fireEvent.click(screen.getByText('Mock Auth Success'));
		});
		expect(mockPostComment).toHaveBeenCalledWith('poll-1', 'Hello', undefined);
		expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument();
		expect(await screen.findByText('Hello')).toBeInTheDocument();
		expect(screen.getByText('1 comment')).toBeInTheDocument();
	});

	it('shows comments to a guest without asking to sign in', async () => {
		mockGetComments.mockResolvedValue({
			ok: true,
			data: {
				items: [{ id: 'c1', author: 'mei', text: 'Saturday works', createdAt: '2026-10-05T00:00:00Z' }],
				nextCursor: null,
			},
		});
		render(<PollCard poll={openPoll} />);
		fireEvent.click(screen.getByText('Discuss'));

		expect(await screen.findByText('Saturday works')).toBeInTheDocument();
		expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument();
	});

	it('keeps the comment text when the guest backs out of sign-in', async () => {
		mockGetComments.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
		render(<PollCard poll={openPoll} />);
		fireEvent.click(screen.getByText('Discuss'));
		const box = await screen.findByPlaceholderText('Why did you vote the way you did?');
		fireEvent.change(box, { target: { value: 'Draft' } });
		fireEvent.click(screen.getByRole('button', { name: 'Post' }));

		expect(mockPostComment).not.toHaveBeenCalled();
		expect(box).toHaveValue('Draft');
	});
});
