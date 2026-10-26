import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import VerificationForm, { RESEND_COOLDOWN_SECONDS } from '@/components/auth/VerificationForm';

// Polyfill APIs missing in jsdom (used by input-otp); ResizeObserver is in jest.setup.ts
if (!document.elementFromPoint) {
	document.elementFromPoint = () => null;
}

jest.mock('@/contexts/LanguageContext', () => ({
	useLanguage: () => ({ t: (key: string) => key }),
	useOptionalTranslate: () => (key: string) => key,
}));

beforeEach(() => {
	jest.clearAllMocks();
});

function fillOTP(value: string) {
	fireEvent.change(screen.getByLabelText('verificationCode.inputLabel'), { target: { value } });
}

function renderForm(overrides: Partial<React.ComponentProps<typeof VerificationForm>> = {}) {
	const props = {
		onSubmitCode: jest.fn().mockResolvedValue({ status: 'OK' }),
		onResend: jest.fn().mockResolvedValue({ status: 'OK' }),
		onEditEmail: jest.fn(),
		...overrides,
	};
	render(<VerificationForm {...props} />);
	return props;
}

describe('VerificationForm', () => {
	it('submits the code as soon as six digits are entered', async () => {
		const { onSubmitCode } = renderForm();
		fillOTP('123456');
		await waitFor(() => expect(onSubmitCode).toHaveBeenCalledWith('123456'));
	});

	it('does not verify the code twice while the first check is out', async () => {
		const { onSubmitCode } = renderForm({ onSubmitCode: jest.fn(() => new Promise<never>(() => {})) });
		fillOTP('123456');
		const button = await screen.findByRole('button', { name: /common\.continue/, busy: true });
		fireEvent.click(button);
		expect(onSubmitCode).toHaveBeenCalledTimes(1);
	});

	it('keeps a wrong code in place, focused and selected so typing replaces it', async () => {
		renderForm({
			onSubmitCode: jest.fn().mockResolvedValue({ status: 'ERROR', error: 'invalidCode' }),
		});
		fillOTP('000000');
		expect(await screen.findByRole('alert')).toHaveTextContent('authError.invalidCode');

		const input = screen.getByLabelText<HTMLInputElement>('verificationCode.inputLabel');
		expect(input).toHaveValue('000000');
		await waitFor(() => expect(input).toHaveFocus());
		expect([input.selectionStart, input.selectionEnd]).toEqual([0, 6]);
	});

	it('clears the error once a new code is typed', async () => {
		renderForm({
			onSubmitCode: jest.fn().mockResolvedValue({ status: 'ERROR', error: 'invalidCode' }),
		});
		fillOTP('000000');
		await screen.findByRole('alert');
		fillOTP('1');
		await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
	});

	it('goes back to edit the email', () => {
		const { onEditEmail } = renderForm();
		fireEvent.click(screen.getByText('verificationCode.useAnotherEmail'));
		expect(onEditEmail).toHaveBeenCalled();
	});

	it('locks the email change while a code is being checked', async () => {
		let finish: (value: { status: 'OK' }) => void = () => {};
		renderForm({ onSubmitCode: jest.fn(() => new Promise((resolve) => (finish = resolve))) });
		fillOTP('123456');
		const change = screen.getByRole('button', { name: 'verificationCode.useAnotherEmail' });
		await waitFor(() => expect(change).toBeDisabled());
		await act(async () => finish({ status: 'OK' }));
		expect(change).toBeEnabled();
	});

	it('only offers resend after the cooldown, then restarts it', async () => {
		jest.useFakeTimers();
		try {
			const { onResend } = renderForm();
			expect(screen.queryByText('verificationCode.resendVerificationCode')).not.toBeInTheDocument();

			for (let i = 0; i < RESEND_COOLDOWN_SECONDS; i++) {
				act(() => {
					jest.advanceTimersByTime(1000);
				});
			}
			fireEvent.click(screen.getByText('verificationCode.resendVerificationCode'));

			await waitFor(() => expect(onResend).toHaveBeenCalled());
			expect(await screen.findByText('verificationCode.codeSent')).toBeInTheDocument();
			expect(screen.queryByText('verificationCode.resendVerificationCode')).not.toBeInTheDocument();
		} finally {
			jest.useRealTimers();
		}
	});
});
