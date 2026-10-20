import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { InviteeManager } from '@/features/polls/components/InviteeManager';

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

beforeEach(() => {
	jest.clearAllMocks();
	mockGetInvitees.mockResolvedValue({ ok: true, data: [bob, dave] });
});

describe('InviteeManager', () => {
	it('lists Invitees by username or email, with who has voted', async () => {
		setup();
		expect(await screen.findByText('bob')).toBeInTheDocument();
		expect(screen.getByText('dave@example.com')).toBeInTheDocument();
		expect(screen.getByText('2 invited, 1 voted')).toBeInTheDocument();
		// Someone who voted can't be removed
		expect(screen.queryByRole('button', { name: 'Remove bob' })).not.toBeInTheDocument();
		expect(mockGetInvitees).toHaveBeenCalledWith('poll-1');
	});

	it('removes an Invitee who hasn\'t voted', async () => {
		mockRemoveInvitee.mockResolvedValue({ ok: true, data: [bob] });
		const { onChanged } = setup();
		fireEvent.click(await screen.findByRole('button', { name: 'Remove dave@example.com' }));
		await waitFor(() => expect(screen.queryByText('dave@example.com')).not.toBeInTheDocument());
		expect(mockRemoveInvitee).toHaveBeenCalledWith('poll-1', dave);
		expect(onChanged).toHaveBeenCalled();
	});

	it('invites more people by email', async () => {
		const carol = { ...dave, email: 'carol@example.com' };
		mockAddInvitees.mockResolvedValue({ ok: true, data: [bob, dave, carol] });
		const { onChanged } = setup();
		await screen.findByText('bob');
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
				groupIds: [],
			})
		);
		expect(await screen.findByText('3 invited, 1 voted')).toBeInTheDocument();
		expect(onChanged).toHaveBeenCalled();
	});

	it('shows the API\'s reason when a change is refused', async () => {
		mockRemoveInvitee.mockResolvedValue({ ok: false, errorCode: 'vote.ended', message: 'The poll has ended' });
		setup();
		fireEvent.click(await screen.findByRole('button', { name: 'Remove dave@example.com' }));
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith('This poll has ended; ballots can no longer be cast or retracted'));
		expect(screen.getByText('dave@example.com')).toBeInTheDocument();
	});
});
