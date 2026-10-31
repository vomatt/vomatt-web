import { fireEvent, render as rtlRender, screen, waitFor } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import type { ReactElement } from 'react';

import { MotionProvider } from '@/components/MotionProvider';
import { PollCreator } from '@/features/polls/components/PollCreator';
import { toDateTimeInput } from '@/features/polls/components/PollCreator/formSchema';
import { listDrafts, saveDraft } from '@/features/polls/drafts';
import { Poll } from '@/features/polls/schema';
import { createPoll, updatePoll } from '@/features/polls/service';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('sonner', () => ({ toast: Object.assign(jest.fn(), { error: jest.fn() }) }));
jest.mock('@/features/polls/service', () => ({
	createPoll: jest.fn(),
	updatePoll: jest.fn(),
}));
const mockSearchUsers = jest.fn();
jest.mock('@/lib/api/services/users', () => ({
	searchUsers: (...args: unknown[]) => mockSearchUsers(...args),
}));
const mockGetGroups = jest.fn();
jest.mock('@/features/groups/service', () => ({ getGroups: () => mockGetGroups() }));

// Render as the app does, so steps and sections that leave are removed; skip the durations
MotionGlobalConfig.skipAnimations = true;
const render = (ui: ReactElement) => rtlRender(ui, { wrapper: MotionProvider });

const mockCreatePoll = createPoll as jest.Mock;
const mockUpdatePoll = updatePoll as jest.Mock;

const TRIGGER = <button>Create Poll</button>;
const QUESTION = 'Your question';
const END = 'Ends';

async function openDialog() {
	fireEvent.click(screen.getByText('Create Poll'));
	await screen.findByLabelText(QUESTION);
}

const review = () => fireEvent.click(screen.getByRole('button', { name: 'Review' }));
const publish = () => fireEvent.click(screen.getByRole('button', { name: 'Publish poll' }));
const pill = (name: string) => screen.getByRole('button', { name });
const custom = () => fireEvent.click(pill('Custom'));

/** Fills the question and two options on the write screen. */
function fillPoll(title = 'Which is best?') {
	fireEvent.change(screen.getByLabelText(QUESTION), { target: { value: title } });
	fireEvent.change(screen.getByLabelText('Option 1'), { target: { value: 'Option A' } });
	fireEvent.change(screen.getByLabelText('Option 2'), { target: { value: 'Option B' } });
}

async function toReview() {
	review();
	await screen.findByText('How voters will see it');
}

beforeEach(() => {
	jest.clearAllMocks();
	localStorage.clear();
	mockCreatePoll.mockResolvedValue({ ok: true, data: {} });
	mockUpdatePoll.mockResolvedValue({ ok: true, data: {} });
	mockGetGroups.mockResolvedValue({
		ok: true,
		data: [{ id: 'g1', name: 'Book club', memberCount: 3, createdAt: '2026-10-09T15:20:31+08:00' }],
	});
	mockSearchUsers.mockResolvedValue({
		items: [{ id: 'u1', username: 'bob', displayName: 'Bob', avatarUrl: null }],
		nextCursor: null,
	});
});

describe('PollCreator', () => {
	// ── Write ─────────────────────────────────────────────────────────────────

	it('opens with the question and the options on one screen', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		expect(screen.getByText('New poll')).toBeInTheDocument();
		expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
		expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
	});

	it('opens with the cursor in the question', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		await waitFor(() => expect(screen.getByLabelText(QUESTION)).toHaveFocus());
	});

	it('counts the title against the 200 limit', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		const title = screen.getByLabelText(QUESTION);
		expect(title).toHaveAttribute('maxLength', '200');
		fireEvent.change(title, { target: { value: 'Which day should the Taipei meetup run?' } });
		expect(screen.getByText('39/200')).toBeInTheDocument();
	});

	it('keeps context folded away until asked for', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		expect(screen.queryByLabelText(/Context/)).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Add context (optional)' }));
		expect(screen.getByLabelText(/Context/)).toBeInTheDocument();
		await waitFor(() => expect(screen.getByLabelText(/Context/)).toHaveFocus());
	});

	it('requires a question before review', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		review();
		expect(await screen.findByText('Ask a question.')).toBeInTheDocument();
		expect(screen.queryByText('How voters will see it')).not.toBeInTheDocument();
	});

	it('rejects a 201-character title', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.change(screen.getByLabelText(QUESTION), { target: { value: 'a'.repeat(201) } });
		review();
		expect(await screen.findByText('Keep the question to 200 characters.')).toBeInTheDocument();
	});

	it('points the question field at its error for screen readers', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		review();
		await screen.findByText('Ask a question.');
		expect(screen.getByLabelText(QUESTION)).toHaveAccessibleDescription('Ask a question.');
	});

	it('requires every option to be filled', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.change(screen.getByLabelText(QUESTION), { target: { value: 'Which?' } });
		fireEvent.change(screen.getByLabelText('Option 1'), { target: { value: 'A' } });
		review();
		expect(await screen.findByText('Fill in every option.')).toBeInTheDocument();
	});

	it('shows one error for the options and points every empty one at it', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.change(screen.getByLabelText(QUESTION), { target: { value: 'Which?' } });
		review();
		expect(await screen.findAllByText('Fill in every option.')).toHaveLength(1);
		expect(screen.getByLabelText('Option 1')).toHaveAccessibleDescription('Fill in every option.');
		expect(screen.getByLabelText('Option 2')).toHaveAccessibleDescription('Fill in every option.');
	});

	it('points each option at its own problem when they differ', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.keyDown(screen.getByLabelText('Option 2'), { key: 'Enter' });
		fireEvent.change(await screen.findByLabelText('Option 3'), { target: { value: 'option a' } });
		fireEvent.keyDown(screen.getByLabelText('Option 3'), { key: 'Enter' });
		await screen.findByLabelText('Option 4');
		review();
		await screen.findByText('Fill in every option.');
		expect(screen.getByLabelText('Option 3')).toHaveAccessibleDescription('Each option must be different.');
		expect(screen.getByLabelText('Option 4')).toHaveAccessibleDescription('Fill in every option.');
	});

	it('takes Add option to an empty option instead of adding another', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.change(screen.getByLabelText('Option 1'), { target: { value: 'Option A' } });
		fireEvent.click(screen.getByRole('button', { name: 'Add option' }));
		await waitFor(() => expect(screen.getByLabelText('Option 2')).toHaveFocus());
		expect(screen.queryByLabelText('Option 3')).not.toBeInTheDocument();
	});

	it('says why Add option went to an empty option, until it is filled', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.change(screen.getByLabelText('Option 1'), { target: { value: 'Option A' } });
		fireEvent.click(screen.getByRole('button', { name: 'Add option' }));
		await waitFor(() => expect(screen.getByLabelText('Option 2')).toHaveFocus());
		expect(screen.getByLabelText('Option 2')).toHaveAccessibleDescription('Fill in every option.');
		fireEvent.change(screen.getByLabelText('Option 2'), { target: { value: 'Option B' } });
		await waitFor(() => expect(screen.queryByText('Fill in every option.')).not.toBeInTheDocument());
	});

	it('reads the hints with their fields', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		expect(screen.getByLabelText(QUESTION)).toHaveAccessibleDescription(
			'Specific, neutral questions get the most honest answers.'
		);
		expect(screen.getByRole('group', { name: 'Who can see and vote?' })).toHaveAccessibleDescription(
			'You can’t change this once the poll opens. Listed in the feed, Explore and search. Anyone can vote.'
		);
	});

	it('keeps focus in the list when an option is removed', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.keyDown(screen.getByLabelText('Option 2'), { key: 'Enter' });
		await screen.findByLabelText('Option 3');
		fireEvent.click(screen.getByRole('button', { name: 'Remove option 3' }));
		await waitFor(() => expect(screen.getByLabelText('Option 2')).toHaveFocus());
	});

	it('makes a removed option inert while it folds away, so a second click removes nothing more', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.keyDown(screen.getByLabelText('Option 2'), { key: 'Enter' });
		fireEvent.change(await screen.findByLabelText('Option 3'), { target: { value: 'Option C' } });
		MotionGlobalConfig.skipAnimations = false;
		try {
			fireEvent.click(screen.getByRole('button', { name: 'Remove option 2' }));
			const leaving = screen.getByDisplayValue('Option B');
			expect(leaving.closest('[inert]')).not.toBeNull();
			expect(screen.getByDisplayValue('Option C').closest('[inert]')).toBeNull();
		} finally {
			MotionGlobalConfig.skipAnimations = true;
		}
	});

	it('adds the next option when Return is pressed in the last one', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.keyDown(screen.getByLabelText('Option 2'), { key: 'Enter' });
		expect(await screen.findByLabelText('Option 3')).toBeInTheDocument();
	});

	it('moves focus to the first problem when review fails', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		review();
		await screen.findByText('Ask a question.');
		expect(screen.getByLabelText(QUESTION)).toHaveFocus();
	});

	it('clears an error as soon as it is fixed', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		review();
		await screen.findByText('Ask a question.');
		fireEvent.change(screen.getByLabelText(QUESTION), { target: { value: 'Which?' } });
		await waitFor(() => expect(screen.queryByText('Ask a question.')).not.toBeInTheDocument());
	});

	it('moves to the next option when Return is pressed in an earlier one', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.keyDown(screen.getByLabelText('Option 1'), { key: 'Enter' });
		await waitFor(() => expect(screen.getByLabelText('Option 2')).toHaveFocus());
		expect(screen.queryByLabelText('Option 3')).not.toBeInTheDocument();
	});

	it('moves focus to the next option at once, so fast typing lands there', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.keyDown(screen.getByLabelText('Option 1'), { key: 'Enter' });
		expect(screen.getByLabelText('Option 2')).toHaveFocus();
	});

	it('keeps the question on one line: Return moves to the first option', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		const notPrevented = fireEvent.keyDown(screen.getByLabelText(QUESTION), { key: 'Enter' });
		expect(notPrevented).toBe(false);
		expect(screen.getByLabelText('Option 1')).toHaveFocus();
	});

	it('publishes a pasted multi-line question as one line', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll('Market night\n  Friday or Saturday?');
		await toReview();
		publish();
		await waitFor(() => expect(mockCreatePoll).toHaveBeenCalled());
		expect(mockCreatePoll.mock.calls[0][0].title).toBe('Market night Friday or Saturday?');
	});

	it('focuses the option it adds, so screen readers announce it', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.keyDown(screen.getByLabelText('Option 2'), { key: 'Enter' });
		await waitFor(() => expect(screen.getByLabelText('Option 3')).toHaveFocus());
	});

	it('rejects two options with the same text', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.change(screen.getByLabelText('Option 2'), { target: { value: ' option a ' } });
		review();
		expect(await screen.findByText('Each option must be different.')).toBeInTheDocument();
		expect(screen.queryByText('How voters will see it')).not.toBeInTheDocument();
	});

	it('goes to review with Cmd or Ctrl+Return from any field', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.keyDown(screen.getByLabelText('Option 1'), { key: 'Enter', metaKey: true });
		expect(await screen.findByText('How voters will see it')).toBeInTheDocument();
	});

	it('publishes once however often Cmd+Return is pressed', async () => {
		mockCreatePoll.mockReturnValue(new Promise(() => {}));
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		await toReview();
		const form = screen.getByRole('button', { name: 'Publish poll' });
		fireEvent.keyDown(form, { key: 'Enter', ctrlKey: true });
		await waitFor(() => expect(mockCreatePoll).toHaveBeenCalledTimes(1));
		fireEvent.keyDown(form, { key: 'Enter', ctrlKey: true });
		fireEvent.keyDown(form, { key: 'Enter', ctrlKey: true });
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(mockCreatePoll).toHaveBeenCalledTimes(1);
	});

	it('leaves the options alone when Return only commits IME text', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.keyDown(screen.getByLabelText('Option 2'), { key: 'Enter', isComposing: true });
		fireEvent.keyDown(screen.getByLabelText('Option 2'), { key: 'Enter', keyCode: 229 });
		expect(screen.queryByLabelText('Option 3')).not.toBeInTheDocument();
	});

	// ── Timing & privacy ──────────────────────────────────────────────────────

	it('shows timing and privacy open, ending in 3 days with the times behind Custom', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		expect(screen.getByRole('heading', { name: 'Timing & privacy' })).toBeInTheDocument();
		expect(pill('3 days')).toHaveAttribute('aria-pressed', 'true');
		expect(pill('Everyone')).toHaveAttribute('aria-pressed', 'true');
		expect(screen.queryByLabelText(END)).not.toBeInTheDocument();
		custom();
		expect(pill('Custom')).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByLabelText('Opens')).toBeInTheDocument();
		expect(screen.getByLabelText(END)).toBeInTheDocument();
		fireEvent.click(pill('1 week'));
		await waitFor(() => expect(screen.queryByLabelText(END)).not.toBeInTheDocument());
	});

	it('defaults Voter Visibility to Only me and has no multi-choice switch', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		expect(pill('Only me')).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByText('Voters see it before they vote.')).toBeInTheDocument();
		expect(screen.queryByRole('switch')).not.toBeInTheDocument();
	});

	it('fills the end time from a preset', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		custom();
		fireEvent.change(screen.getByLabelText('Opens'), { target: { value: '2030-01-01T10:00' } });
		fireEvent.click(screen.getByRole('button', { name: '1 week' }));
		expect(screen.getByLabelText(END)).toHaveValue('2030-01-08T10:00');
		expect(screen.getByRole('button', { name: '1 week' })).toHaveAttribute('aria-pressed', 'true');
	});

	it('names the visible-to-all choice by who can see an invite-only poll', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		expect(screen.getByRole('button', { name: 'Everyone signed in' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Invite only' }));
		expect(screen.queryByRole('button', { name: 'Everyone signed in' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Everyone invited' })).toBeInTheDocument();
	});

	it('keeps a chosen preset measured from the opening time when that changes', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		custom();
		fireEvent.change(screen.getByLabelText('Opens'), { target: { value: '2030-03-01T09:00' } });
		fireEvent.click(screen.getByRole('button', { name: '1 week' }));
		fireEvent.change(screen.getByLabelText('Opens'), { target: { value: '2030-04-01T09:00' } });
		expect(screen.getByLabelText(END)).toHaveValue('2030-04-08T09:00');
		expect(screen.getByRole('button', { name: '1 week' })).toHaveAttribute('aria-pressed', 'true');
	});

	it('measures a preset from publishing, not from when it was picked', async () => {
		jest.useFakeTimers({ advanceTimers: true });
		try {
			render(<PollCreator triggerChildren={TRIGGER} />);
			await openDialog();
			fillPoll();
			fireEvent.click(pill('1 week'));
			// Writing takes a while: past the minute, and seconds the time field can't hold
			jest.setSystemTime(Date.now() + 90_500);
			await toReview();
			publish();
			await waitFor(() => expect(mockCreatePoll).toHaveBeenCalled());
		} finally {
			jest.useRealTimers();
		}
		const { startTime, endTime } = mockCreatePoll.mock.calls[0][0];
		expect(Date.parse(endTime) - Date.parse(startTime)).toBe(7 * 24 * 3600_000);
	});

	it('keeps a preset’s end ahead however long the form stays open', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.click(pill('1 hour'));
		const realNow = Date.now();
		const now = jest.spyOn(Date, 'now').mockReturnValue(realNow + 2 * 3600_000);
		try {
			await toReview();
		} finally {
			now.mockRestore();
		}
		expect(screen.queryByText('The end must be after the poll opens.')).not.toBeInTheDocument();
	});

	it('focuses a draft’s missing end time', async () => {
		const draft = saveDraft({
			title: 'Which is best?',
			description: '',
			options: [{ text: 'Option A' }, { text: 'Option B' }],
			startTime: '',
			endTime: '',
			voterVisibility: 'owner',
			audience: 'public',
			invitees: { users: [], emails: [], groups: [] },
		});
		render(<PollCreator triggerChildren={TRIGGER} draft={draft} />);
		await openDialog();
		review();
		await screen.findByText('Choose when the poll ends.');
		await waitFor(() => expect(screen.getByLabelText(END)).toHaveFocus());
	});

	it('rejects an end before the start', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		custom();
		fireEvent.change(screen.getByLabelText('Opens'), { target: { value: '2030-01-02T10:00' } });
		fireEvent.change(screen.getByLabelText(END), { target: { value: '2030-01-01T10:00' } });
		review();
		expect(await screen.findByText('The end must be after the poll opens.')).toBeInTheDocument();
	});

	// ── Review and publish ────────────────────────────────────────────────────

	it('reviews the poll the way voters will see it, with the rules', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll('Night market: Fridays or Saturdays?');
		await toReview();
		expect(screen.getByText('Night market: Fridays or Saturdays?')).toBeInTheDocument();
		expect(screen.getByText('Option A')).toBeInTheDocument();
		expect(screen.getByText('Option B')).toBeInTheDocument();
		expect(screen.getByText(/Only you will see who chose what once it ends\./)).toBeInTheDocument();
	});

	it('announces the review step by moving focus to its title', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		await toReview();
		await waitFor(() => expect(screen.getByText('Review your poll')).toHaveFocus());
	});

	it('previews a poll ending within a day with the Closing chip', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.click(screen.getByRole('button', { name: '24 hours' }));
		await toReview();
		expect(await screen.findByText(/^Ends in /)).toBeInTheDocument();
	});

	it('reviews a draft with an unreadable start time instead of throwing', async () => {
		const draft = saveDraft({
			title: 'Which is best?',
			description: '',
			options: [{ text: 'Option A' }, { text: 'Option B' }],
			startTime: 'not a date',
			endTime: '2030-01-01T22:00',
			voterVisibility: 'owner',
			audience: 'public',
			invitees: { users: [], emails: [], groups: [] },
		});
		render(<PollCreator triggerChildren={TRIGGER} draft={draft} />);
		await openDialog();
		await toReview();
		expect(screen.getByText('Which is best?')).toBeInTheDocument();
	});

	it('goes back to editing with everything kept', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		await toReview();
		fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
		expect(await screen.findByLabelText(QUESTION)).toHaveValue('Which is best?');
		expect(screen.getByLabelText('Option 2')).toHaveValue('Option B');
		await waitFor(() => expect(screen.getByLabelText(QUESTION)).toHaveFocus());
	});

	it('offers Edit beside Publish, within thumb reach on phones', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		await toReview();
		const footerEdit = screen.getAllByRole('button', { name: 'Edit' }).at(-1)!;
		expect(footerEdit.parentElement).toContainElement(screen.getByRole('button', { name: 'Publish poll' }));
		fireEvent.click(footerEdit);
		expect(await screen.findByLabelText(QUESTION)).toHaveValue('Which is best?');
	});

	it('publishes with ISO times and the chosen visibility', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll('  Which is best?  ');
		custom();
		fireEvent.change(screen.getByLabelText(END), { target: { value: '2030-01-01T22:00' } });
		fireEvent.click(pill('Nobody'));
		expect(pill('Nobody')).toHaveAttribute('aria-pressed', 'true');
		await toReview();
		expect(screen.getByText(/Nobody will see who chose what\./)).toBeInTheDocument();
		publish();

		await waitFor(() => expect(mockCreatePoll).toHaveBeenCalled());
		expect(mockCreatePoll.mock.calls[0][0]).toEqual({
			title: 'Which is best?',
			description: undefined,
			options: [{ text: 'Option A' }, { text: 'Option B' }],
			startTime: expect.stringMatching(/Z$/),
			endTime: new Date('2030-01-01T22:00').toISOString(),
			voterVisibility: 'nobody',
			audience: 'public',
		});
		await waitFor(() => expect(screen.queryByText('How voters will see it')).not.toBeInTheDocument());
	});

	// ── Audience and Invitees ─────────────────────────────────────────────────

	it('publishes an Unlisted poll', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.click(pill('Unlisted'));
		expect(screen.getByText('Not listed anywhere. Anyone with the link can vote.')).toBeInTheDocument();
		await toReview();
		expect(screen.getByText('Only people with the link can find it.')).toBeInTheDocument();
		publish();
		await waitFor(() => expect(mockCreatePoll).toHaveBeenCalled());
		expect(mockCreatePoll.mock.calls[0][0]).toMatchObject({ audience: 'unlisted', invitees: undefined });
	});

	it('invites people, emails and Groups to an Invite-only poll', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.click(pill('Invite only'));

		fireEvent.click(await screen.findByRole('button', { name: 'Book club, 3 members' }));
		const field = screen.getByLabelText('Invite people');
		fireEvent.change(field, { target: { value: 'bo' } });
		fireEvent.click(await screen.findByRole('button', { name: /bob/ }));
		expect(mockSearchUsers).toHaveBeenCalledWith('bo');
		fireEvent.change(field, { target: { value: ' Carol@Example.com ' } });
		fireEvent.keyDown(field, { key: 'Enter' });
		expect(screen.getByText('carol@example.com')).toBeInTheDocument();
		// Enter in the picker adds, it never moves on to review
		expect(screen.queryByText('How voters will see it')).not.toBeInTheDocument();

		await toReview();
		expect(screen.getByText(/Only the people you invited can see it and vote\./)).toBeInTheDocument();
		publish();
		await waitFor(() => expect(mockCreatePoll).toHaveBeenCalled());
		expect(mockCreatePoll.mock.calls[0][0]).toMatchObject({
			audience: 'invite-only',
			invitees: { userIds: ['u1'], emails: ['carol@example.com'], inviteListIds: ['g1'] },
		});
	});

	it('asks for someone to invite before review', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.click(pill('Invite only'));
		review();
		expect(await screen.findByText('Invite at least one person or invite list.')).toBeInTheDocument();
		expect(screen.getByLabelText('Invite people')).toHaveAccessibleDescription('Invite at least one person or invite list.');
		expect(screen.queryByText('How voters will see it')).not.toBeInTheDocument();
	});

	it('takes the creator to the new poll after publishing', async () => {
		mockCreatePoll.mockResolvedValue({ ok: true, data: { id: 'poll-new' } });
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		await toReview();
		publish();

		await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/poll/poll-new'));
	});

	it('stays on review and shows the error when publishing fails', async () => {
		mockCreatePoll.mockResolvedValue({ ok: false, message: 'Something went wrong' });
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		await toReview();
		publish();

		await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong'));
		expect(screen.getByText('How voters will see it')).toBeInTheDocument();
	});

	it('announces the same publish error again on a second failure', async () => {
		mockCreatePoll.mockResolvedValue({ ok: false, message: 'Something went wrong' });
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		await toReview();
		const alert = screen.getByRole('alert');
		expect(alert).toBeEmptyDOMElement();
		publish();
		await waitFor(() => expect(alert).toHaveTextContent('Something went wrong'));
		publish();
		await waitFor(() => expect(mockCreatePoll).toHaveBeenCalledTimes(2));
		expect(screen.getByRole('alert')).toBe(alert);
		await waitFor(() => expect(alert).toHaveTextContent('Something went wrong'));
	});

	// ── Drafts ────────────────────────────────────────────────────────────────

	it('saves a draft to local storage', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.change(screen.getByLabelText(QUESTION), { target: { value: 'Half-written' } });
		fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

		const [draft] = listDrafts();
		expect(draft.values.title).toBe('Half-written');
	});

	it('offers to keep unsaved work as a draft on close', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.change(screen.getByLabelText(QUESTION), { target: { value: 'Half-written' } });
		fireEvent.click(screen.getByRole('button', { name: 'Close' }));

		expect(await screen.findByText('Keep this poll as a draft?')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Keep draft' }));
		expect(listDrafts()[0].values.title).toBe('Half-written');
	});

	it('resumes a draft saved before Audience existed and deletes it once published', async () => {
		const values = {
			title: 'From a draft',
			description: '',
			options: [{ text: 'Yes' }, { text: 'No' }],
			startTime: '',
			endTime: '2030-01-01T10:00',
			voterVisibility: 'signed-in' as const,
		};
		localStorage.setItem('vomatt_poll_drafts', JSON.stringify([{ id: 'd1', savedAt: '', values }]));
		const [draft] = listDrafts();
		render(<PollCreator draft={draft} open onOpenChange={jest.fn()} />);

		expect(screen.getByLabelText(QUESTION)).toHaveValue('From a draft');
		await toReview();
		publish();

		await waitFor(() =>
			expect(mockCreatePoll).toHaveBeenCalledWith(
				expect.objectContaining({ title: 'From a draft', voterVisibility: 'signed-in' })
			)
		);
		expect(listDrafts()).toEqual([]);
	});

	// ── Edit ──────────────────────────────────────────────────────────────────

	it('edits a Scheduled Poll with PUT, pre-filled', async () => {
		const poll: Poll = {
			id: 'poll-9',
			title: 'Move the review to Thursdays?',
			active: true,
			votingActive: false,
			creatorId: 'u1',
			creatorUsername: 'klaus',
			createdAt: '2030-01-01T00:00:00Z',
			startTime: '2030-01-05T01:00:00Z',
			endTime: '2030-01-08T01:00:00Z',
			voterVisibility: 'nobody',
			options: [
				{ id: 'a', text: 'Yes, Thursday' },
				{ id: 'b', text: 'Keep Tuesday' },
			],
		};
		const onSaved = jest.fn();
		render(<PollCreator poll={poll} open onOpenChange={jest.fn()} onSaved={onSaved} />);

		expect(screen.getByText('Edit poll')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Save draft' })).not.toBeInTheDocument();
		expect(screen.getByLabelText(QUESTION)).toHaveValue(poll.title);
		expect(screen.getByLabelText('Option 2')).toHaveValue('Keep Tuesday');
		expect(pill('Nobody')).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByLabelText('Opens')).toHaveValue(toDateTimeInput(new Date(poll.startTime)));
		await toReview();
		fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

		await waitFor(() =>
			expect(mockUpdatePoll).toHaveBeenCalledWith(
				'poll-9',
				expect.objectContaining({
					title: poll.title,
					startTime: '2030-01-05T01:00:00.000Z',
					endTime: '2030-01-08T01:00:00.000Z',
					voterVisibility: 'nobody',
				})
			)
		);
		expect(mockCreatePoll).not.toHaveBeenCalled();
		expect(onSaved).toHaveBeenCalled();
	});

	it('edits an Invite-only Poll without replacing its Invitees', async () => {
		const poll: Poll = {
			id: 'poll-9',
			title: 'Book for November?',
			active: true,
			votingActive: false,
			creatorId: 'u1',
			creatorUsername: 'klaus',
			createdAt: '2030-01-01T00:00:00Z',
			startTime: '2030-01-05T01:00:00Z',
			endTime: '2030-01-08T01:00:00Z',
			voterVisibility: 'owner',
			audience: 'invite-only',
			inviteeCount: 4,
			options: [
				{ id: 'a', text: 'Dune' },
				{ id: 'b', text: 'Emma' },
			],
		};
		render(<PollCreator poll={poll} open onOpenChange={jest.fn()} />);
		expect(pill('Invite only')).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByText('Add or remove people with Invitees on the poll.')).toBeInTheDocument();
		await toReview();
		fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
		await waitFor(() => expect(mockUpdatePoll).toHaveBeenCalled());
		expect(mockUpdatePoll.mock.calls[0][1]).toMatchObject({ audience: 'invite-only', invitees: undefined });
	});

	it('asks before discarding unsaved edits', async () => {
		const poll: Poll = {
			id: 'poll-9',
			title: 'Original title',
			active: true,
			votingActive: false,
			creatorId: 'u1',
			creatorUsername: 'klaus',
			createdAt: '2030-01-01T00:00:00Z',
			startTime: '2030-01-05T01:00:00Z',
			endTime: '2030-01-08T01:00:00Z',
			options: [
				{ id: 'a', text: 'Yes' },
				{ id: 'b', text: 'No' },
			],
		};
		const onOpenChange = jest.fn();
		render(<PollCreator poll={poll} open onOpenChange={onOpenChange} />);
		fireEvent.change(screen.getByLabelText(QUESTION), { target: { value: 'Edited title' } });
		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

		expect(await screen.findByText('Discard your changes?')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
		expect(onOpenChange).not.toHaveBeenCalledWith(false);
		expect(screen.getByLabelText(QUESTION)).toHaveValue('Edited title');

		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
		fireEvent.click(await screen.findByRole('button', { name: 'Discard' }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(listDrafts()).toEqual([]);
	});
});

describe('PollCreator with animations running', () => {
	beforeEach(() => {
		MotionGlobalConfig.skipAnimations = false;
	});
	afterEach(() => {
		MotionGlobalConfig.skipAnimations = true;
	});

	it('keeps the leaving step out of reach while it fades, then removes it', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		review();
		await screen.findByText('How voters will see it');
		expect(screen.getByLabelText(QUESTION).closest('[inert]')).not.toBeNull();
		await waitFor(() => expect(screen.queryByLabelText(QUESTION)).not.toBeInTheDocument());
	});

	it('keeps focus in the question after review fades away', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		await toReview();
		await waitFor(() => expect(screen.queryByLabelText(QUESTION)).not.toBeInTheDocument());
		fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
		await waitFor(() => expect(screen.getByLabelText(QUESTION)).toHaveFocus());
		await waitFor(() => expect(screen.queryByText('How voters will see it')).not.toBeInTheDocument());
		expect(screen.getByLabelText(QUESTION)).toHaveFocus();
	});

	it('carries focus into the context field while it unfolds', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.click(screen.getByRole('button', { name: 'Add context (optional)' }));
		await waitFor(() => expect(screen.getByLabelText(/Context/)).toHaveFocus());
	});
});
