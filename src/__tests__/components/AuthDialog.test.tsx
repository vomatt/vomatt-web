import { fireEvent, render, screen, waitFor } from '@testing-library/react';

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

const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ refresh: mockRefresh }),
}));

jest.mock('@/contexts/LanguageContext', () => ({
	useLanguage: () => ({ t: (key: string) => key }),
}));

const mockRequestOtp = jest.fn();
const mockVerifyOtp = jest.fn();
const mockUpdateProfile = jest.fn();

jest.mock('@/lib/api/services/auth', () => ({
	requestOtp: (...args: unknown[]) => mockRequestOtp(...args),
	verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
}));

jest.mock('@/lib/api/services/users', () => ({
	updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

beforeEach(() => {
	jest.clearAllMocks();
});

const baseProps = {
	open: true,
	onOpenChange: jest.fn(),
	onAuthSuccess: jest.fn(),
};

async function submitEmail(email = 'user@test.com') {
	fireEvent.change(screen.getByLabelText('common.email'), { target: { value: email } });
	fireEvent.click(screen.getByRole('button', { name: 'auth.continueWithEmail' }));
	await screen.findByText('verificationCode.title');
}

function fillOTP(value: string) {
	fireEvent.change(screen.getByLabelText('verificationCode.inputLabel'), { target: { value } });
}

describe('AuthDialog', () => {
	it('starts with the email step', () => {
		render(<AuthDialog {...baseProps} />);
		expect(screen.getByLabelText('common.email')).toBeInTheDocument();
	});

	it('renders nothing when closed', () => {
		render(<AuthDialog {...baseProps} open={false} />);
		expect(screen.queryByLabelText('common.email')).not.toBeInTheDocument();
	});

	it('validates the email before sending a code', async () => {
		render(<AuthDialog {...baseProps} />);
		fireEvent.change(screen.getByLabelText('common.email'), { target: { value: 'nope' } });
		fireEvent.click(screen.getByRole('button', { name: 'auth.continueWithEmail' }));

		expect(await screen.findByText('common.invalidEmailAddress')).toBeInTheDocument();
		expect(mockRequestOtp).not.toHaveBeenCalled();
	});

	it('shows a send error on the email step', async () => {
		mockRequestOtp.mockResolvedValue({ status: 'ERROR', error: 'rateLimited' });
		render(<AuthDialog {...baseProps} />);
		fireEvent.change(screen.getByLabelText('common.email'), { target: { value: 'a@b.co' } });
		fireEvent.click(screen.getByRole('button', { name: 'auth.continueWithEmail' }));

		expect(await screen.findByRole('alert')).toHaveTextContent('authError.rateLimited');
	});

	it('signs in an existing user: email → code → success, then refreshes server data', async () => {
		mockRequestOtp.mockResolvedValue({ status: 'SUCCESS', isNewUser: false });
		mockVerifyOtp.mockResolvedValue({ status: 'SUCCESS' });
		render(<AuthDialog {...baseProps} />);

		await submitEmail();
		fillOTP('123456');

		await waitFor(() => expect(baseProps.onAuthSuccess).toHaveBeenCalled());
		expect(mockVerifyOtp).toHaveBeenCalledWith('user@test.com', '123456');
		expect(mockRefresh).toHaveBeenCalled();
	});

	it('asks a new user for a display name before finishing', async () => {
		mockRequestOtp.mockResolvedValue({ status: 'SUCCESS', isNewUser: true });
		mockVerifyOtp.mockResolvedValue({ status: 'SUCCESS' });
		mockUpdateProfile.mockResolvedValue({});
		render(<AuthDialog {...baseProps} />);

		await submitEmail('newbie@test.com');
		fillOTP('123456');

		const name = await screen.findByLabelText('onboarding.displayName');
		expect(name).toHaveValue('newbie');
		expect(baseProps.onAuthSuccess).not.toHaveBeenCalled();

		fireEvent.change(name, { target: { value: 'New Bie' } });
		fireEvent.click(screen.getByRole('button', { name: 'onboarding.finish' }));

		await waitFor(() => expect(baseProps.onAuthSuccess).toHaveBeenCalled());
		expect(mockUpdateProfile).toHaveBeenCalledWith({ displayName: 'New Bie' });
	});

	it('lets a new user skip the display name', async () => {
		mockRequestOtp.mockResolvedValue({ status: 'SUCCESS', isNewUser: true });
		mockVerifyOtp.mockResolvedValue({ status: 'SUCCESS' });
		render(<AuthDialog {...baseProps} />);

		await submitEmail();
		fillOTP('123456');
		fireEvent.click(await screen.findByRole('button', { name: 'onboarding.skip' }));

		expect(baseProps.onAuthSuccess).toHaveBeenCalled();
		expect(mockUpdateProfile).not.toHaveBeenCalled();
	});
});
