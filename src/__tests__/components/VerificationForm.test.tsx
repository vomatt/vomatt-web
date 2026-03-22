import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VerificationForm from '@/components/auth/VerificationForm';

// Polyfill APIs missing in jsdom (used by input-otp)
global.ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
} as any;

if (!document.elementFromPoint) {
	document.elementFromPoint = () => null;
}

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/contexts/LanguageContext', () => ({
	useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('@/lib/api/services/auth', () => ({
	resendVerification: jest.fn(),
}));

beforeEach(() => {
	jest.clearAllMocks();
});

function fillOTP(value: string) {
	const inputs = document.querySelectorAll('input');
	inputs.forEach((input) => {
		fireEvent.change(input, { target: { value } });
	});
}

describe('VerificationForm', () => {
	const baseProps = {
		email: 'test@example.com',
		backButtonFunc: jest.fn(),
	};

	it('calls onSuccess instead of router.replace when onSuccess is provided', async () => {
		const onSuccess = jest.fn();
		const submitCodeFunc = jest
			.fn()
			.mockResolvedValue({ status: 'OK' });

		render(
			<VerificationForm
				{...baseProps}
				submitCodeFunc={submitCodeFunc}
				onSuccess={onSuccess}
			/>
		);

		fillOTP('123456');
		fireEvent.submit(screen.getByRole('button', { name: 'common.continue' }));

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalled();
		});
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('calls router.replace(redirectTo) when onSuccess is not provided', async () => {
		const submitCodeFunc = jest
			.fn()
			.mockResolvedValue({ status: 'OK' });

		render(
			<VerificationForm
				{...baseProps}
				submitCodeFunc={submitCodeFunc}
				redirectTo="/my-polls"
			/>
		);

		fillOTP('123456');
		fireEvent.submit(screen.getByRole('button', { name: 'common.continue' }));

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith('/my-polls');
		});
	});

	it('does not call onSuccess when verification fails', async () => {
		const onSuccess = jest.fn();
		const submitCodeFunc = jest
			.fn()
			.mockResolvedValue({ status: 'ERROR', message: 'invalidCode' });

		render(
			<VerificationForm
				{...baseProps}
				submitCodeFunc={submitCodeFunc}
				onSuccess={onSuccess}
			/>
		);

		fillOTP('123456');
		fireEvent.submit(screen.getByRole('button', { name: 'common.continue' }));

		await waitFor(() => {
			expect(submitCodeFunc).toHaveBeenCalledWith('123456');
		});
		expect(onSuccess).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();
	});
});
