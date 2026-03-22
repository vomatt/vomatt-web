import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthDialog } from '@/components/auth/AuthDialog';

// Polyfill APIs missing in jsdom
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

const mockGetVerifyCode = jest.fn();
const mockLogin = jest.fn();
const mockPreSignup = jest.fn();
const mockSignup = jest.fn();
const mockResendVerification = jest.fn();

jest.mock('@/lib/api/services/auth', () => ({
	getVerifyCode: (...args: any[]) => mockGetVerifyCode(...args),
	login: (...args: any[]) => mockLogin(...args),
	preSignup: (...args: any[]) => mockPreSignup(...args),
	signup: (...args: any[]) => mockSignup(...args),
	resendVerification: (...args: any[]) => mockResendVerification(...args),
}));

beforeEach(() => {
	jest.clearAllMocks();
});

describe('AuthDialog', () => {
	const baseProps = {
		open: true,
		onOpenChange: jest.fn(),
		onAuthSuccess: jest.fn(),
	};

	it('renders login form when open', () => {
		render(<AuthDialog {...baseProps} />);
		expect(screen.getByPlaceholderText('m@example.com')).toBeInTheDocument();
	});

	it('does not render when closed', () => {
		render(<AuthDialog {...baseProps} open={false} />);
		expect(screen.queryByPlaceholderText('m@example.com')).not.toBeInTheDocument();
	});

	it('shows sign up link that switches to signup form', async () => {
		render(<AuthDialog {...baseProps} />);

		fireEvent.click(screen.getByText('common.signUp'));

		await waitFor(() => {
			expect(screen.getByLabelText('common.firstName')).toBeInTheDocument();
			expect(screen.getByLabelText('common.lastName')).toBeInTheDocument();
			expect(screen.getByLabelText('common.username')).toBeInTheDocument();
		});
	});

	it('shows log in link from signup that switches back', async () => {
		render(<AuthDialog {...baseProps} />);

		// Switch to signup
		fireEvent.click(screen.getByText('common.signUp'));
		await waitFor(() => {
			expect(screen.getByLabelText('common.username')).toBeInTheDocument();
		});

		// Switch back to login
		fireEvent.click(screen.getByText('common.login'));
		await waitFor(() => {
			expect(screen.queryByLabelText('common.username')).not.toBeInTheDocument();
			expect(screen.getByPlaceholderText('m@example.com')).toBeInTheDocument();
		});
	});

	it('login flow: email → verification → onAuthSuccess', async () => {
		mockGetVerifyCode.mockResolvedValue({ status: 'SUCCESS' });
		mockLogin.mockResolvedValue({ status: 'SUCCESS' });

		render(<AuthDialog {...baseProps} />);

		// Enter email and submit
		fireEvent.change(screen.getByPlaceholderText('m@example.com'), {
			target: { value: 'user@test.com' },
		});
		fireEvent.submit(screen.getByRole('button', { name: 'common.login' }));

		// Should transition to verification
		await waitFor(() => {
			expect(mockGetVerifyCode).toHaveBeenCalledWith('user@test.com');
			expect(screen.getByText('verificationCode.title')).toBeInTheDocument();
		});

		// Fill OTP and submit
		const otpInputs = document.querySelectorAll('input');
		otpInputs.forEach((input) => {
			fireEvent.change(input, { target: { value: '123456' } });
		});
		fireEvent.submit(screen.getByRole('button', { name: 'common.continue' }));

		await waitFor(() => {
			expect(baseProps.onAuthSuccess).toHaveBeenCalled();
		});
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('signup flow: form → verification → onAuthSuccess', async () => {
		mockPreSignup.mockResolvedValue({ status: 'SUCCESS' });
		mockSignup.mockResolvedValue({ status: 'SUCCESS' });

		render(<AuthDialog {...baseProps} />);

		// Switch to signup
		fireEvent.click(screen.getByText('common.signUp'));
		await waitFor(() => {
			expect(screen.getByLabelText('common.username')).toBeInTheDocument();
		});

		// Fill signup form
		fireEvent.change(screen.getByLabelText('common.email'), {
			target: { value: 'new@test.com' },
		});
		fireEvent.change(screen.getByLabelText('common.firstName'), {
			target: { value: 'John' },
		});
		fireEvent.change(screen.getByLabelText('common.lastName'), {
			target: { value: 'Doe' },
		});
		fireEvent.change(screen.getByLabelText('common.username'), {
			target: { value: 'johndoe' },
		});
		fireEvent.submit(screen.getByRole('button', { name: 'signup.submit' }));

		// Should transition to verification
		await waitFor(() => {
			expect(mockPreSignup).toHaveBeenCalledWith('new@test.com', 'johndoe');
			expect(screen.getByText('verificationCode.title')).toBeInTheDocument();
		});

		// Fill OTP and submit
		const otpInputs = document.querySelectorAll('input');
		otpInputs.forEach((input) => {
			fireEvent.change(input, { target: { value: '654321' } });
		});
		fireEvent.submit(screen.getByRole('button', { name: 'common.continue' }));

		await waitFor(() => {
			expect(baseProps.onAuthSuccess).toHaveBeenCalled();
		});
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('USER_NOT_FOUND on login switches to signup mode', async () => {
		mockGetVerifyCode.mockResolvedValue({
			status: 'ERROR',
			errorType: 'USER_NOT_FOUND',
		});

		render(<AuthDialog {...baseProps} />);

		fireEvent.change(screen.getByPlaceholderText('m@example.com'), {
			target: { value: 'new@test.com' },
		});
		fireEvent.submit(screen.getByRole('button', { name: 'common.login' }));

		// Should switch to signup mode
		await waitFor(() => {
			expect(screen.getByLabelText('common.username')).toBeInTheDocument();
		});
	});

	it('resets state when dialog closes and reopens', async () => {
		const { rerender } = render(<AuthDialog {...baseProps} />);

		// Switch to signup
		fireEvent.click(screen.getByText('common.signUp'));
		await waitFor(() => {
			expect(screen.getByLabelText('common.username')).toBeInTheDocument();
		});

		// Close
		rerender(<AuthDialog {...baseProps} open={false} />);

		// Reopen — should show login again
		rerender(<AuthDialog {...baseProps} open={true} />);
		await waitFor(() => {
			expect(screen.queryByLabelText('common.username')).not.toBeInTheDocument();
			expect(screen.getByPlaceholderText('m@example.com')).toBeInTheDocument();
		});
	});
});
