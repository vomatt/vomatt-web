import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { InviteeManager } from '@/features/polls/components/InviteeManager';
import { searchUsers } from '@/lib/api/services/users';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: Object.assign(jest.fn(), { error: jest.fn() }) }));

const mockGetInvitees = jest.fn();
const mockAddInvitees = jest.fn();
const mockRemoveInvitee = jest.fn();
jest.mock('@/features/polls/service', () => ({
	getInvitees: (...args: unknown[]) => mockGetInvitees(...args),
	addInvitees: (...args: unknown[]) => mockAddInvitees(...args),
	removeInvitee: (...args: unknown[]) => mockRemoveInvitee(...args),
}));
jest.mock('@/lib/api/services/users', () => ({ searchUsers: jest.fn() }));
jest.mock('@/features/groups/service', () => ({
	getGroups: () => Promise.resolve({ ok: true, data: [] }),
}));

const at = '2026-10-09T15:20:31+08:00';
const bob = { userId: 'u1', username: 'bob', email: null, hasBallot: true, invitedAt: at };
const dave = { userId: null, username: null, email: 'dave@example.com', hasBallot: false, invitedAt: at };

const setup = () => {
	const onChanged = jest.fn();
	render(<InviteeManager pollId="poll-1" open onOpenChange={jest.fn()} onChanged={onChanged} />);
	return { onChanged };
};

const askToRemoveDave = async () =>
	fireEvent.click(await screen.findByRole('button', { name: 'Remove dave@example.com' }));

// The confirm button is busy until the list has been checked again
const confirmRemoval = async () => {
	const button = await screen.findByRole('button', { name: 'Remove and end poll' });
	await waitFor(() => expect(button).not.toHaveAttribute('data-loading'));
	fireEvent.click(button);
	return button;
};

beforeEach(() => {
	jest.clearAllMocks();
	mockGetInvitees.mockResolvedValue({ ok: true, data: [bob, dave] });
});

describe('InviteeManager', () => {
	it('lists Invitees by username or email, with who has voted', async () => {
		setup();
		expect(await screen.findByText('@bob')).toBeInTheDocument();
		expect(screen.getByText('dave@example.com')).toBeInTheDocument();
		expect(screen.getByText('2 invited, 1 voted')).toBeInTheDocument();
		// Someone who voted can't be removed
		expect(screen.queryByRole('button', { name: 'Remove bob' })).not.toBeInTheDocument();
		expect(mockGetInvitees).toHaveBeenCalledWith('poll-1');
	});

	it('leaves current Invitees out of the username search', async () => {
		jest.mocked(searchUsers).mockResolvedValue({
			items: [
				{ id: 'u1', username: 'bob' },
				{ id: 'u2', username: 'bobby' },
			],
			nextCursor: null,
		} as never);
		setup();
		await screen.findByText('@bob');
		fireEvent.change(screen.getByPlaceholderText('Username or email'), { target: { value: 'bob' } });
		expect(await screen.findByRole('button', { name: '@bobby' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: '@bob' })).not.toBeInTheDocument();
	});

	it('asks before removing an Invitee', async () => {
		setup();
		await askToRemoveDave();
		expect(await screen.findByRole('alertdialog', { name: 'Remove dave@example.com?' })).toBeInTheDocument();
		expect(mockRemoveInvitee).not.toHaveBeenCalled();
	});

	it('removes an Invitee who hasn\'t voted once confirmed', async () => {
		mockRemoveInvitee.mockResolvedValue({ ok: true, data: [bob] });
		const { onChanged } = setup();
		await askToRemoveDave();
		await confirmRemoval();
		await waitFor(() => expect(screen.queryByText('dave@example.com')).not.toBeInTheDocument());
		expect(mockRemoveInvitee).toHaveBeenCalledWith('poll-1', dave);
		expect(onChanged).toHaveBeenCalled();
	});

	it('warns that the Poll ends when everyone left has voted', async () => {
		setup();
		await askToRemoveDave();
		expect(
			await screen.findByText(
				'Everyone else has voted, so the poll ends now and the results are revealed. This can’t be undone.'
			)
		).toBeInTheDocument();
	});

	it('only says they lose access when someone else still hasn\'t voted', async () => {
		const erin = { ...dave, email: 'erin@example.com' };
		mockGetInvitees.mockResolvedValue({ ok: true, data: [bob, dave, erin] });
		setup();
		await askToRemoveDave();
		expect(await screen.findByText('They’ll no longer see this poll or be able to vote.')).toBeInTheDocument();
		expect(await screen.findByRole('button', { name: 'Remove' })).toBeInTheDocument();
	});

	it('checks who has voted again before warning', async () => {
		const erin = { ...dave, email: 'erin@example.com' };
		mockGetInvitees
			.mockResolvedValueOnce({ ok: true, data: [bob, dave, erin] })
			.mockResolvedValue({ ok: true, data: [bob, dave, { ...erin, hasBallot: true }] });
		setup();
		await askToRemoveDave();
		expect(await screen.findByRole('button', { name: 'Remove and end poll' })).toBeInTheDocument();
	});

	it('sends one removal when the confirm is pressed twice', async () => {
		mockRemoveInvitee.mockResolvedValue({ ok: true, data: [bob] });
		setup();
		await askToRemoveDave();
		const button = await confirmRemoval();
		fireEvent.click(button);
		await waitFor(() => expect(screen.queryByText('dave@example.com')).not.toBeInTheDocument());
		expect(mockRemoveInvitee).toHaveBeenCalledTimes(1);
	});

	it('shows the list as it is now when a removal is refused', async () => {
		mockRemoveInvitee.mockResolvedValue({ ok: false, errorCode: 'vote.invitee.has_ballot', message: 'has ballot' });
		setup();
		await askToRemoveDave();
		mockGetInvitees.mockResolvedValue({ ok: true, data: [bob, { ...dave, hasBallot: true }] });
		await confirmRemoval();
		await waitFor(() => expect(screen.queryByRole('button', { name: 'Remove dave@example.com' })).not.toBeInTheDocument());
		expect(screen.getByText('dave@example.com')).toBeInTheDocument();
	});

	it('invites more people by email', async () => {
		const carol = { ...dave, email: 'carol@example.com' };
		mockAddInvitees.mockResolvedValue({ ok: true, data: [bob, dave, carol] });
		const { onChanged } = setup();
		await screen.findByText('@bob');
		const invite = screen.getByRole('button', { name: 'Invite' });
		expect(invite).toBeDisabled();

		const field = screen.getByLabelText('Invite more people');
		fireEvent.change(field, { target: { value: 'carol@example.com' } });
		fireEvent.keyDown(field, { key: 'Enter' });
		fireEvent.click(invite);

		await waitFor(() =>
			expect(mockAddInvitees).toHaveBeenCalledWith('poll-1', {
				userIds: [],
				emails: ['carol@example.com'],
				inviteListIds: [],
			})
		);
		expect(await screen.findByText('3 invited, 1 voted')).toBeInTheDocument();
		expect(onChanged).toHaveBeenCalled();
	});

	it('shows the API\'s reason when a change is refused', async () => {
		mockRemoveInvitee.mockResolvedValue({ ok: false, errorCode: 'vote.ended', message: 'The poll has ended' });
		setup();
		await askToRemoveDave();
		await confirmRemoval();
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith('This poll has ended; ballots can no longer be cast or retracted'));
		expect(screen.getByText('dave@example.com')).toBeInTheDocument();
	});
});
