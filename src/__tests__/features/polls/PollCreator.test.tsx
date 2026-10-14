import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PollCreator } from '@/features/polls/components/PollCreator';
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

const mockCreatePoll = createPoll as jest.Mock;
const mockUpdatePoll = updatePoll as jest.Mock;

const TRIGGER = <button>Create Poll</button>;
const QUESTION = 'Your question';
const END = 'Ends and reveals results';

async function openDialog() {
	fireEvent.click(screen.getByText('Create Poll'));
	await screen.findByLabelText(QUESTION);
}

const review = () => fireEvent.click(screen.getByRole('button', { name: 'Review' }));
const publish = () => fireEvent.click(screen.getByRole('button', { name: 'Publish poll' }));
const openSettings = () => fireEvent.click(screen.getByRole('button', { name: /Change/ }));

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

	it('requires every option to be filled', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.change(screen.getByLabelText(QUESTION), { target: { value: 'Which?' } });
		fireEvent.change(screen.getByLabelText('Option 1'), { target: { value: 'A' } });
		review();
		expect(await screen.findByText('Fill in every option.')).toBeInTheDocument();
	});

	it('adds the next option when Return is pressed in the last one', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		fireEvent.keyDown(screen.getByLabelText('Option 2'), { key: 'Enter' });
		expect(await screen.findByLabelText('Option 3')).toBeInTheDocument();
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

	it('folds timing and privacy into a summary that opens on demand', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		expect(screen.getByText('After it ends: Only me')).toBeInTheDocument();
		expect(screen.queryByLabelText(END)).not.toBeInTheDocument();
		openSettings();
		expect(screen.getByLabelText(END)).toBeInTheDocument();
	});

	it('defaults Voter Visibility to Only me and has no multi-choice switch', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		openSettings();
		expect(screen.getByLabelText(/Only me/)).toBeChecked();
		expect(
			screen.getByText("You can't change this once the poll opens. Voters see it before they vote.")
		).toBeInTheDocument();
		expect(screen.queryByRole('switch')).not.toBeInTheDocument();
	});

	it('fills the end time from a preset', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		openSettings();
		fireEvent.change(screen.getByLabelText('Opens'), { target: { value: '2030-01-01T10:00' } });
		fireEvent.click(screen.getByRole('button', { name: '1 week' }));
		expect(screen.getByLabelText(END)).toHaveValue('2030-01-08T10:00');
		expect(screen.getByRole('button', { name: '1 week' })).toHaveAttribute('aria-pressed', 'true');
	});

	it('opens the settings to show a missing end time', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		openSettings();
		fireEvent.change(screen.getByLabelText(END), { target: { value: '' } });
		fireEvent.click(screen.getByRole('button', { name: /Done/ })); // fold it away again
		review();
		expect(await screen.findByText('Choose when the poll ends.')).toBeInTheDocument();
		expect(screen.getByLabelText(END)).toBeInTheDocument();
		expect(mockCreatePoll).not.toHaveBeenCalled();
	});

	it('rejects an end before the start', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		openSettings();
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

	it('previews a poll ending within a day with the Closing chip', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll();
		openSettings();
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
		fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
		expect(await screen.findByLabelText(QUESTION)).toHaveValue('Which is best?');
		expect(screen.getByLabelText('Option 2')).toHaveValue('Option B');
	});

	it('publishes with ISO times and the chosen visibility', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillPoll('  Which is best?  ');
		openSettings();
		fireEvent.click(screen.getByRole('button', { name: '24 hours' }));
		fireEvent.change(screen.getByLabelText(END), { target: { value: '2030-01-01T22:00' } });
		fireEvent.click(screen.getByLabelText(/Nobody/));
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
		});
		await waitFor(() => expect(screen.queryByText('How voters will see it')).not.toBeInTheDocument());
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

		expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
		expect(screen.getByText('How voters will see it')).toBeInTheDocument();
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

	it('resumes a draft and deletes it once published', async () => {
		const values = {
			title: 'From a draft',
			description: '',
			options: [{ text: 'Yes' }, { text: 'No' }],
			startTime: '',
			endTime: '2030-01-01T10:00',
			voterVisibility: 'signed-in' as const,
		};
		const draft = saveDraft(values);
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
		openSettings();
		expect(screen.getByLabelText(/Nobody/)).toBeChecked();
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
