import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PollCreator } from '@/features/polls/components/PollCreator';
import { listDrafts, saveDraft } from '@/features/polls/drafts';
import { Poll } from '@/features/polls/schema';
import { createPoll, updatePoll } from '@/features/polls/service';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: Object.assign(jest.fn(), { error: jest.fn() }) }));
jest.mock('@/features/polls/service', () => ({
	createPoll: jest.fn(),
	updatePoll: jest.fn(),
}));

const mockCreatePoll = createPoll as jest.Mock;
const mockUpdatePoll = updatePoll as jest.Mock;

const TRIGGER = <button>Create Poll</button>;

async function openDialog() {
	fireEvent.click(screen.getByText('Create Poll'));
	await screen.findByLabelText('What would you like to ask?');
}

const next = () => fireEvent.click(screen.getByRole('button', { name: 'Next' }));
const publish = () => fireEvent.click(screen.getByRole('button', { name: 'Publish poll' }));

/** Fills the question and two options and lands on step 3. */
async function fillToTiming(title = 'Which is best?') {
	fireEvent.change(screen.getByLabelText('What would you like to ask?'), {
		target: { value: title },
	});
	next();
	fireEvent.change(await screen.findByLabelText('Options 1'), { target: { value: 'Option A' } });
	fireEvent.change(screen.getByLabelText('Options 2'), { target: { value: 'Option B' } });
	next();
	await screen.findByLabelText('Ends and reveals results');
}

beforeEach(() => {
	jest.clearAllMocks();
	localStorage.clear();
	mockCreatePoll.mockResolvedValue({ ok: true, data: {} });
	mockUpdatePoll.mockResolvedValue({ ok: true, data: {} });
});

describe('PollCreator', () => {
	it('renders the trigger and opens on step 1', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		expect(screen.getByText('Create a New Poll')).toBeInTheDocument();
		expect(screen.getByText('1 Question')).toHaveAttribute('aria-current', 'step');
	});

	// ── Step 1 ────────────────────────────────────────────────────────────────

	it('counts the title against the 200 limit', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		const title = screen.getByLabelText('What would you like to ask?');
		expect(title).toHaveAttribute('maxLength', '200');
		fireEvent.change(title, { target: { value: 'Which day should the Taipei meetup run?' } });
		expect(screen.getByText('39/200')).toBeInTheDocument();
	});

	it('requires a question before moving on', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		next();
		expect(await screen.findByText('Ask a question.')).toBeInTheDocument();
		expect(screen.getByText('1 Question')).toHaveAttribute('aria-current', 'step');
	});

	it('rejects a 201-character title', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.change(screen.getByLabelText('What would you like to ask?'), {
			target: { value: 'a'.repeat(201) },
		});
		next();
		expect(await screen.findByText('Keep the question to 200 characters.')).toBeInTheDocument();
	});

	// ── Step 2 ────────────────────────────────────────────────────────────────

	it('requires every option to be filled', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.change(screen.getByLabelText('What would you like to ask?'), {
			target: { value: 'Which?' },
		});
		next();
		fireEvent.change(await screen.findByLabelText('Options 1'), { target: { value: 'A' } });
		next();
		expect(await screen.findByText('Fill in every option.')).toBeInTheDocument();
	});

	it('has no multi-choice switch', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		await fillToTiming();
		expect(screen.queryByRole('switch')).not.toBeInTheDocument();
	});

	// ── Step 3 and publish ────────────────────────────────────────────────────

	it('defaults Voter Visibility to Only me', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		await fillToTiming();
		expect(screen.getByLabelText(/Only me/)).toBeChecked();
		expect(
			screen.getByText(
				"You can't change this once the poll opens. Voters see it before they vote."
			)
		).toBeInTheDocument();
	});

	it('cannot publish without an end time', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		await fillToTiming();
		fireEvent.change(screen.getByLabelText('Ends and reveals results'), {
			target: { value: '' },
		});
		publish();
		expect(await screen.findByText('Choose when the poll ends.')).toBeInTheDocument();
		expect(mockCreatePoll).not.toHaveBeenCalled();
	});

	it('rejects an end before the start', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		await fillToTiming();
		fireEvent.change(screen.getByLabelText('Opens'), { target: { value: '2030-01-02T10:00' } });
		fireEvent.change(screen.getByLabelText('Ends and reveals results'), {
			target: { value: '2030-01-01T10:00' },
		});
		publish();
		expect(
			await screen.findByText('The end must be after the poll opens.')
		).toBeInTheDocument();
	});

	it('publishes with ISO times and the chosen visibility', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		await fillToTiming('  Which is best?  ');
		fireEvent.click(screen.getByRole('button', { name: '24 hours' }));
		fireEvent.change(screen.getByLabelText('Ends and reveals results'), {
			target: { value: '2030-01-01T22:00' },
		});
		fireEvent.click(screen.getByLabelText(/Nobody/));
		publish();

		await waitFor(() => expect(mockCreatePoll).toHaveBeenCalled());
		const input = mockCreatePoll.mock.calls[0][0];
		expect(input).toEqual({
			title: 'Which is best?',
			description: undefined,
			options: [{ text: 'Option A' }, { text: 'Option B' }],
			startTime: expect.stringMatching(/Z$/),
			endTime: new Date('2030-01-01T22:00').toISOString(),
			voterVisibility: 'nobody',
		});
		await waitFor(() =>
			expect(screen.queryByLabelText('Ends and reveals results')).not.toBeInTheDocument()
		);
	});

	it('fills the end time from a preset', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		await fillToTiming();
		fireEvent.change(screen.getByLabelText('Opens'), { target: { value: '2030-01-01T10:00' } });
		fireEvent.click(screen.getByRole('button', { name: '1 week' }));
		expect(screen.getByLabelText('Ends and reveals results')).toHaveValue('2030-01-08T10:00');
		expect(screen.getByRole('button', { name: '1 week' })).toHaveAttribute('aria-pressed', 'true');
	});

	it('stays open and shows the error when publishing fails', async () => {
		mockCreatePoll.mockResolvedValue({ ok: false, message: 'Something went wrong' });
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		await fillToTiming();
		publish();

		expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
		expect(screen.getByLabelText('Ends and reveals results')).toBeInTheDocument();
	});

	// ── Drafts ────────────────────────────────────────────────────────────────

	it('saves a draft to local storage', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fireEvent.change(screen.getByLabelText('What would you like to ask?'), {
			target: { value: 'Half-written' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));

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

		expect(screen.getByLabelText('What would you like to ask?')).toHaveValue('From a draft');
		next();
		next();
		await screen.findByLabelText('Ends and reveals results');
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
		expect(screen.queryByRole('button', { name: 'Save Draft' })).not.toBeInTheDocument();
		expect(screen.getByLabelText('What would you like to ask?')).toHaveValue(poll.title);
		next();
		expect(await screen.findByLabelText('Options 2')).toHaveValue('Keep Tuesday');
		next();
		expect(await screen.findByLabelText(/Nobody/)).toBeChecked();
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
		fireEvent.change(screen.getByLabelText('What would you like to ask?'), {
			target: { value: 'Edited title' },
		});
		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

		expect(await screen.findByText('Discard your changes?')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
		expect(onOpenChange).not.toHaveBeenCalledWith(false);
		expect(screen.getByLabelText('What would you like to ask?')).toHaveValue('Edited title');

		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
		fireEvent.click(await screen.findByRole('button', { name: 'Discard' }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(listDrafts()).toEqual([]);
	});
});
