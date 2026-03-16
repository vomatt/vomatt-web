import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PollCreator } from '@/components/PollCreator';
import * as pollsEndpoint from '@/lib/api/services/polls';

jest.mock('@/contexts/LanguageContext', () => ({
	useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/lib/api/endpoints/polls', () => ({
	createPoll: jest.fn(),
}));

const mockCreatePoll = pollsEndpoint.createPoll as jest.Mock;

const TRIGGER = <button>Create Poll</button>;

/** Fill in the minimum valid form fields (question + 2 options). */
function fillRequiredFields() {
	fireEvent.change(
		screen.getByPlaceholderText('pollCreator.questionPlaceholder'),
		{
			target: { value: 'Which is best?' },
		}
	);
	const optionInputs = screen.getAllByPlaceholderText(
		/pollCreator\.optionsPlaceholder/
	);
	fireEvent.change(optionInputs[0], { target: { value: 'Option A' } });
	fireEvent.change(optionInputs[1], { target: { value: 'Option B' } });
}

async function openDialog() {
	fireEvent.click(screen.getByText('Create Poll'));
	await waitFor(() =>
		expect(
			screen.getByPlaceholderText('pollCreator.questionPlaceholder')
		).toBeInTheDocument()
	);
}

beforeEach(() => {
	localStorage.clear();
	mockCreatePoll.mockResolvedValue({ status: 'SUCCESS' });
});

describe('PollCreator', () => {
	it('renders the trigger element', () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		expect(screen.getByText('Create Poll')).toBeInTheDocument();
	});

	it('opens the dialog on trigger click', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		expect(screen.getByText('pollCreator.title')).toBeInTheDocument();
	});

	// ── Privacy mode ──────────────────────────────────────────────────────────

	it('renders all three privacy mode buttons', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		expect(screen.getByText('pollCreator.privacyPublic')).toBeInTheDocument();
		expect(screen.getByText('pollCreator.privacyLinkOnly')).toBeInTheDocument();
		expect(
			screen.getByText('pollCreator.privacyInviteOnly')
		).toBeInTheDocument();
	});

	it('does not show invite-users input when mode is public (default)', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		expect(
			screen.queryByText('pollCreator.inviteUsersLabel')
		).not.toBeInTheDocument();
	});

	it('shows invite-users input when invite-only mode is selected', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.click(screen.getByText('pollCreator.privacyInviteOnly'));
		expect(
			screen.getByText('pollCreator.inviteUsersLabel')
		).toBeInTheDocument();
	});

	it('hides invite-users input again when switching back to public', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.click(screen.getByText('pollCreator.privacyInviteOnly'));
		fireEvent.click(screen.getByText('pollCreator.privacyPublic'));
		expect(
			screen.queryByText('pollCreator.inviteUsersLabel')
		).not.toBeInTheDocument();
	});

	it('adds invited users via Enter key and removes them via × button', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.click(screen.getByText('pollCreator.privacyInviteOnly'));

		const inviteInput = screen.getByPlaceholderText(
			'pollCreator.inviteUsersPlaceholder'
		);
		fireEvent.change(inviteInput, { target: { value: 'alice' } });
		fireEvent.keyDown(inviteInput, { key: 'Enter' });
		expect(screen.getByText('alice')).toBeInTheDocument();

		// Remove the tag
		const removeBtn = screen
			.getByText('alice')
			.parentElement!.querySelector('button')!;
		fireEvent.click(removeBtn);
		expect(screen.queryByText('alice')).not.toBeInTheDocument();
	});

	it('adds invited users on comma key', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.click(screen.getByText('pollCreator.privacyInviteOnly'));

		const inviteInput = screen.getByPlaceholderText(
			'pollCreator.inviteUsersPlaceholder'
		);
		fireEvent.change(inviteInput, { target: { value: 'bob' } });
		fireEvent.keyDown(inviteInput, { key: ',' });
		expect(screen.getByText('bob')).toBeInTheDocument();
	});

	// ── Validation ────────────────────────────────────────────────────────────

	it('disables submit when question is empty', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		const btn = screen
			.getByText('pollCreator.createPollLabel')
			.closest('button')!;
		expect(btn).toBeDisabled();
	});

	it('disables submit when invite-only with no invited users', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillRequiredFields();
		fireEvent.click(screen.getByText('pollCreator.privacyInviteOnly'));
		const btn = screen
			.getByText('pollCreator.createPollLabel')
			.closest('button')!;
		expect(btn).toBeDisabled();
	});

	it('enables submit when invite-only with at least one invited user', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillRequiredFields();
		fireEvent.click(screen.getByText('pollCreator.privacyInviteOnly'));

		const inviteInput = screen.getByPlaceholderText(
			'pollCreator.inviteUsersPlaceholder'
		);
		fireEvent.change(inviteInput, { target: { value: 'charlie' } });
		fireEvent.keyDown(inviteInput, { key: 'Enter' });

		const btn = screen
			.getByText('pollCreator.createPollLabel')
			.closest('button')!;
		expect(btn).not.toBeDisabled();
	});

	// ── Submission ────────────────────────────────────────────────────────────

	it('calls createPoll with privacyMode: public by default', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillRequiredFields();
		fireEvent.click(screen.getByText('pollCreator.createPollLabel'));

		await waitFor(() =>
			expect(mockCreatePoll).toHaveBeenCalledWith(
				expect.objectContaining({ privacyMode: 'public' })
			)
		);
	});

	it('calls createPoll with privacyMode: link-only when selected', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillRequiredFields();
		fireEvent.click(screen.getByText('pollCreator.privacyLinkOnly'));
		fireEvent.click(screen.getByText('pollCreator.createPollLabel'));

		await waitFor(() =>
			expect(mockCreatePoll).toHaveBeenCalledWith(
				expect.objectContaining({ privacyMode: 'link-only' })
			)
		);
	});

	it('calls createPoll with invitedUsers when invite-only', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillRequiredFields();
		fireEvent.click(screen.getByText('pollCreator.privacyInviteOnly'));

		const inviteInput = screen.getByPlaceholderText(
			'pollCreator.inviteUsersPlaceholder'
		);
		fireEvent.change(inviteInput, { target: { value: 'dave' } });
		fireEvent.keyDown(inviteInput, { key: 'Enter' });

		fireEvent.click(screen.getByText('pollCreator.createPollLabel'));

		await waitFor(() =>
			expect(mockCreatePoll).toHaveBeenCalledWith(
				expect.objectContaining({
					privacyMode: 'invite-only',
					invitedUsers: ['dave'],
				})
			)
		);
	});

	it('keeps dialog open when createPoll returns ERROR status', async () => {
		mockCreatePoll.mockResolvedValue({
			status: 'ERROR',
			message: 'Something went wrong',
		});
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillRequiredFields();
		fireEvent.click(screen.getByText('pollCreator.createPollLabel'));

		await waitFor(() => expect(mockCreatePoll).toHaveBeenCalled());
		// Dialog stays open — the question field is still visible
		expect(
			screen.getByPlaceholderText('pollCreator.questionPlaceholder')
		).toBeInTheDocument();
	});
});
