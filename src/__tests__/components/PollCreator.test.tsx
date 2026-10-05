import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PollCreator } from '@/components/PollCreator';
import * as pollsEndpoint from '@/features/polls/service';

jest.mock('@/contexts/LanguageContext', () => ({
	useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/features/polls/service', () => ({
	createPoll: jest.fn(),
}));

const mockCreatePoll = pollsEndpoint.createPoll as jest.Mock;

const TRIGGER = <button>Create Poll</button>;

/** Fill in the minimum valid form fields (title + 2 options). */
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
	fireEvent.change(document.getElementById('endTime')!, {
		target: { value: '2026-10-07T22:00' },
	});
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
	mockCreatePoll.mockResolvedValue({ ok: true, data: {} });
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

	// ── Validation ────────────────────────────────────────────────────────────

	it('disables submit when question is empty', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		const btn = screen
			.getByText('pollCreator.createPollLabel')
			.closest('button')!;
		expect(btn).toBeDisabled();
	});

	it('enables submit when title and options are filled', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillRequiredFields();
		const btn = screen
			.getByText('pollCreator.createPollLabel')
			.closest('button')!;
		expect(btn).not.toBeDisabled();
	});

	// ── Submission ────────────────────────────────────────────────────────────

	it('calls createPoll with correct data', async () => {
		render(<PollCreator triggerChildren={TRIGGER} />);
		await openDialog();
		fillRequiredFields();
		fireEvent.click(screen.getByText('pollCreator.createPollLabel'));

		await waitFor(() =>
			expect(mockCreatePoll).toHaveBeenCalledWith(
				expect.objectContaining({
					title: 'Which is best?',
					endTime: new Date('2026-10-07T22:00').toISOString(),
					voterVisibility: 'owner',
				})
			)
		);
	});

	it('keeps dialog open when createPoll fails', async () => {
		mockCreatePoll.mockResolvedValue({ ok: false, message: 'Something went wrong' });
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
