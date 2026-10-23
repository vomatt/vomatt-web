import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

import { ReportProblemDialog } from '@/features/feedback/ReportProblemDialog';
import { reportProblem } from '@/features/feedback/service';

jest.mock('@/contexts/LanguageContext', () =>
	require('../../helpers/mockLanguage')
);
jest.mock('sonner', () => ({
	toast: { error: jest.fn(), success: jest.fn() },
}));
jest.mock('@/features/feedback/service', () => ({ reportProblem: jest.fn() }));

const mockReport = reportProblem as jest.Mock;

beforeEach(() => jest.resetAllMocks());

function renderDialog() {
	const onOpenChange = jest.fn();
	render(<ReportProblemDialog open onOpenChange={onOpenChange} />);
	return { onOpenChange };
}

it('keeps Submit disabled until there is a message', async () => {
	renderDialog();
	const submit = screen.getByRole('button', { name: 'Submit' });
	expect(submit).toBeDisabled();
	await userEvent.type(
		screen.getByRole('textbox', { name: 'Describe the problem' }),
		'   '
	);
	expect(submit).toBeDisabled();
});

it('sends the trimmed message, then closes and thanks', async () => {
	mockReport.mockResolvedValue({ ok: true, data: undefined });
	const { onOpenChange } = renderDialog();
	await userEvent.type(
		screen.getByRole('textbox', { name: 'Describe the problem' }),
		' Votes vanish '
	);
	await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

	await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
	expect(mockReport).toHaveBeenCalledWith('Votes vanish');
	expect(toast.success).toHaveBeenCalledWith('Thanks. We got your report.');
});

it('stays open with the message when sending fails', async () => {
	mockReport.mockResolvedValue({ ok: false, message: 'x' });
	const { onOpenChange } = renderDialog();
	const field = screen.getByRole('textbox', { name: 'Describe the problem' });
	await userEvent.type(field, 'Votes vanish');
	await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

	await waitFor(() =>
		expect(toast.error).toHaveBeenCalledWith(
			'Couldn’t send your report. Try again.',
			{ duration: Infinity }
		)
	);
	expect(onOpenChange).not.toHaveBeenCalled();
	expect(field).toHaveValue('Votes vanish');
});

it('shows the backend’s message for a known error code', async () => {
	mockReport.mockResolvedValue({
		ok: false,
		errorCode: 'common.conflict',
		message: 'x',
	});
	renderDialog();
	await userEvent.type(
		screen.getByRole('textbox', { name: 'Describe the problem' }),
		'Votes vanish'
	);
	await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

	await waitFor(() =>
		expect(toast.error).toHaveBeenCalledWith(
			'Another change is in progress. Try again in a moment.',
			{
				duration: Infinity,
			}
		)
	);
});
