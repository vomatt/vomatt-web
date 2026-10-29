import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AuthDialog } from '@/components/auth/AuthDialog';

// Polyfill APIs missing in jsdom
if (!document.elementFromPoint) {
	document.elementFromPoint = () => null;
}

jest.mock('@/contexts/LanguageContext', () => ({
	useLanguage: () => ({ t: (key: string) => key }),
	useOptionalTranslate: () => (key: string) => key,
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

// @portabletext/react ships ESM only, which Jest doesn't load
jest.mock('@/components/CustomPortableText', () => ({
	__esModule: true,
	default: ({ blocks }: { blocks: { children: { text: string }[] }[] }) =>
		blocks.map((block) => block.children.map((child) => child.text).join('')).join(' '),
}));

const mockGetPolicyMessage = jest.fn();

const mockToastError = jest.fn();
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a) } }));
jest.mock('@/components/auth/policy', () => ({
	getPolicyMessage: () => mockGetPolicyMessage(),
}));

beforeEach(() => {
	jest.clearAllMocks();
	mockGetPolicyMessage.mockResolvedValue(null);
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

	it('titles the dialog itself, without a page heading inside it', () => {
		render(<AuthDialog {...baseProps} />);
		const dialog = screen.getByRole('dialog', { name: 'login.title' });
		expect(dialog).toHaveAccessibleDescription('login.dialogDescription');
		expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
	});

	it('shows the sign-up terms under the email step', async () => {
		mockGetPolicyMessage.mockResolvedValue([
			{ _type: 'block', _key: 'a', children: [{ _type: 'span', _key: 'b', text: 'By continuing you agree to the terms.' }] },
		]);
		render(<AuthDialog {...baseProps} />);
		expect(await screen.findByText('By continuing you agree to the terms.')).toBeInTheDocument();
	});

	it('names the address the code went to in the dialog description', async () => {
		mockRequestOtp.mockResolvedValue({ status: 'SUCCESS' });
		render(<AuthDialog {...baseProps} />);
		await submitEmail();
		expect(screen.getByRole('dialog', { name: 'verificationCode.title' })).toHaveAccessibleDescription(
			'verificationCode.subtitle user@test.com'
		);
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

	it('sends one code however often the email step is submitted', async () => {
		mockRequestOtp.mockReturnValue(new Promise(() => {}));
		render(<AuthDialog {...baseProps} />);
		fireEvent.change(screen.getByLabelText('common.email'), { target: { value: 'a@b.co' } });
		fireEvent.click(screen.getByRole('button', { name: 'auth.continueWithEmail' }));

		const button = await screen.findByRole('button', { name: /auth\.continueWithEmail/, busy: true });
		// Validation is async, so give a second submit time to reach requestOtp
		await act(async () => {
			fireEvent.click(button);
			await new Promise((resolve) => setTimeout(resolve, 50));
		});
		expect(mockRequestOtp).toHaveBeenCalledTimes(1);
	});

	it('signs in an existing user: email → code → success', async () => {
		mockRequestOtp.mockResolvedValue({ status: 'SUCCESS' });
		mockVerifyOtp.mockResolvedValue({ status: 'SUCCESS', isNewUser: false });
		render(<AuthDialog {...baseProps} />);

		await submitEmail();
		fillOTP('123456');

		await waitFor(() => expect(baseProps.onAuthSuccess).toHaveBeenCalled());
		expect(mockVerifyOtp).toHaveBeenCalledWith('user@test.com', '123456');
	});

	it('asks a new user for their first and last name before finishing', async () => {
		mockRequestOtp.mockResolvedValue({ status: 'SUCCESS' });
		mockVerifyOtp.mockResolvedValue({ status: 'SUCCESS', isNewUser: true });
		mockUpdateProfile.mockResolvedValue({});
		render(<AuthDialog {...baseProps} />);

		await submitEmail('newbie@test.com');
		fillOTP('123456');

		const first = await screen.findByLabelText('profile.firstName');
		expect(first).toHaveValue('');
		expect(screen.queryByLabelText('profile.displayName')).not.toBeInTheDocument();
		expect(baseProps.onAuthSuccess).not.toHaveBeenCalled();

		fireEvent.change(first, { target: { value: 'New' } });
		fireEvent.change(screen.getByLabelText('profile.lastName'), { target: { value: 'Bie' } });
		fireEvent.click(screen.getByRole('button', { name: 'onboarding.finish' }));

		await waitFor(() => expect(baseProps.onAuthSuccess).toHaveBeenCalled());
		expect(mockUpdateProfile).toHaveBeenCalledWith({ firstName: 'New', lastName: 'Bie' });
	});

	it('needs a first name to finish, but not a last name', async () => {
		mockRequestOtp.mockResolvedValue({ status: 'SUCCESS' });
		mockVerifyOtp.mockResolvedValue({ status: 'SUCCESS', isNewUser: true });
		mockUpdateProfile.mockResolvedValue({});
		render(<AuthDialog {...baseProps} />);

		await submitEmail('newbie@test.com');
		fillOTP('123456');
		fireEvent.click(await screen.findByRole('button', { name: 'onboarding.finish' }));
		expect(await screen.findByText('common.required')).toBeInTheDocument();
		expect(mockUpdateProfile).not.toHaveBeenCalled();

		fireEvent.change(screen.getByLabelText('profile.firstName'), { target: { value: 'Cher' } });
		fireEvent.click(screen.getByRole('button', { name: 'onboarding.finish' }));
		await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledWith({ firstName: 'Cher' }));
	});

	it('resumes the started action when the dialog is closed at the name step', async () => {
		mockRequestOtp.mockResolvedValue({ status: 'SUCCESS' });
		mockVerifyOtp.mockResolvedValue({ status: 'SUCCESS', isNewUser: true });
		render(<AuthDialog {...baseProps} />);

		await submitEmail();
		fillOTP('123456');
		await screen.findByLabelText('profile.firstName');
		fireEvent.click(screen.getAllByRole('button', { name: 'common.close' })[0]);

		expect(baseProps.onAuthSuccess).toHaveBeenCalled();
		expect(baseProps.onOpenChange).not.toHaveBeenCalledWith(false);
		expect(mockUpdateProfile).not.toHaveBeenCalled();
	});

	it('closes as cancelled before the code is entered', async () => {
		mockRequestOtp.mockResolvedValue({ status: 'SUCCESS' });
		render(<AuthDialog {...baseProps} />);

		await submitEmail();
		fireEvent.click(screen.getAllByRole('button', { name: 'common.close' })[0]);

		expect(baseProps.onOpenChange).toHaveBeenCalledWith(false);
		expect(baseProps.onAuthSuccess).not.toHaveBeenCalled();
	});

	it('lets a new user through when their name fails to save, and says so', async () => {
		mockRequestOtp.mockResolvedValue({ status: 'SUCCESS' });
		mockVerifyOtp.mockResolvedValue({ status: 'SUCCESS', isNewUser: true });
		mockUpdateProfile.mockRejectedValue(new Error('down'));
		render(<AuthDialog {...baseProps} />);

		await submitEmail();
		fillOTP('123456');
		fireEvent.change(await screen.findByLabelText('profile.firstName'), { target: { value: 'Mei' } });
		fireEvent.click(screen.getByRole('button', { name: 'onboarding.finish' }));

		await waitFor(() => expect(baseProps.onAuthSuccess).toHaveBeenCalled());
		expect(mockToastError).toHaveBeenCalledWith('onboarding.saveFailed');
	});
});
