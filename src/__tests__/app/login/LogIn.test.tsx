import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { LogIn } from '@/app/(frontend)/login/_component/LogIn';
import { getPasskeyLoginOptions, verifyPasskeyLogin } from '@/lib/api/services/auth';

let mockSearch = '';
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
	useRouter: () => ({ replace: mockReplace }),
	useSearchParams: () => new URLSearchParams(mockSearch),
}));

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

jest.mock('@/lib/api/services/auth', () => ({
	requestOtp: jest.fn(),
	verifyOtp: jest.fn(),
	getPasskeyLoginOptions: jest.fn(),
	verifyPasskeyLogin: jest.fn(),
}));
jest.mock('@/lib/api/services/users', () => ({ updateProfile: jest.fn() }));

// @portabletext/react ships ESM only, which Jest doesn't load
jest.mock('@/components/CustomPortableText', () => ({
	__esModule: true,
	default: ({ blocks }: { blocks: { children: { text: string }[] }[] }) =>
		blocks.map((block) => block.children.map((child) => child.text).join('')).join(' '),
}));

describe('LogIn', () => {
	it('explains an expired session before the title, where reading starts', () => {
		mockSearch = 'session_expired=1';
		render(<LogIn />);
		const notice = screen.getByText('Your session expired. Please log in again.');
		const title = screen.getByRole('heading', { level: 1, name: 'Log in or sign up' });
		expect(notice.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it('says a deleted account is gone, not merely expired', () => {
		mockSearch = 'session_expired=deleted';
		render(<LogIn />);
		expect(screen.getByText(/This account was deleted/)).toBeInTheDocument();
		expect(screen.queryByText(/session expired/)).not.toBeInTheDocument();
	});

	it('shows no notice on a plain visit', () => {
		mockSearch = '';
		render(<LogIn />);
		expect(screen.queryByText(/session expired/)).not.toBeInTheDocument();
	});

	it('shows the sign-up terms under the email step', () => {
		mockSearch = '';
		render(
			<LogIn
				policyMessage={[
					{ _type: 'block', _key: 'a', children: [{ _type: 'span', _key: 'b', text: 'By continuing you agree to the terms.' }] },
				]}
			/>
		);
		expect(screen.getByText('By continuing you agree to the terms.')).toBeInTheDocument();
	});
});

describe('LogIn with a passkey', () => {
	const mockGetOptions = getPasskeyLoginOptions as jest.Mock;
	const mockVerify = verifyPasskeyLogin as jest.Mock;
	const mockGet = jest.fn();
	const mockConditionalAvailable = jest.fn();
	const optionsJson = { challenge: 'Y2hhbGxlbmdl', rpId: 'vomatt.com' };
	const parsedOptions = { challenge: new ArrayBuffer(8) };
	const credentialJson = { id: 'cred-1', rawId: 'cred-1', type: 'public-key', response: {} };
	const credential = { toJSON: () => credentialJson };
	const passkeyButton = () => screen.getByRole('button', { name: 'Continue with a passkey' });
	/** The autofill request: pending until a passkey is picked, rejecting like browsers do when aborted. */
	let pickPasskey: () => void;
	let conditionalSignal: AbortSignal | undefined;

	beforeEach(() => {
		jest.clearAllMocks();
		mockSearch = 'redirect=/polls/p1';
		mockGetOptions.mockResolvedValue({ status: 'SUCCESS', options: optionsJson });
		mockVerify.mockResolvedValue({ status: 'SUCCESS' });
		mockConditionalAvailable.mockResolvedValue(false);
		conditionalSignal = undefined;
		mockGet.mockImplementation(({ mediation, signal }: CredentialRequestOptions) => {
			if (mediation !== 'conditional') return Promise.resolve(credential);
			conditionalSignal = signal ?? undefined;
			return new Promise((resolve, reject) => {
				pickPasskey = () => resolve(credential);
				signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
			});
		});
		Object.defineProperty(window, 'PublicKeyCredential', {
			configurable: true,
			value: {
				parseCreationOptionsFromJSON: jest.fn(),
				parseRequestOptionsFromJSON: jest.fn(() => parsedOptions),
				isConditionalMediationAvailable: mockConditionalAvailable,
			},
		});
		Object.defineProperty(navigator, 'credentials', { configurable: true, value: { create: jest.fn(), get: mockGet } });
	});

	afterEach(() => {
		delete (window as { PublicKeyCredential?: unknown }).PublicKeyCredential;
		delete (navigator as { credentials?: unknown }).credentials;
	});

	it('signs in from the button and goes to the redirect', async () => {
		render(<LogIn />);
		fireEvent.click(passkeyButton());

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/polls/p1'));
		expect(mockGet).toHaveBeenCalledWith(expect.objectContaining({ publicKey: parsedOptions, mediation: undefined }));
		expect(window.PublicKeyCredential.parseRequestOptionsFromJSON).toHaveBeenCalledWith(optionsJson);
		expect(mockVerify).toHaveBeenCalledWith(credentialJson);
	});

	it('shows why a passkey was rejected', async () => {
		mockVerify.mockResolvedValue({ status: 'ERROR', error: 'apiError.auth.passkey.invalid' });
		render(<LogIn />);
		fireEvent.click(passkeyButton());

		expect(await screen.findByText('Passkey verification failed. Please try again')).toBeInTheDocument();
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('stays quiet when the user closes the passkey sheet', async () => {
		mockGet.mockRejectedValue(new DOMException('cancelled', 'NotAllowedError'));
		render(<LogIn />);
		fireEvent.click(passkeyButton());

		await waitFor(() => expect(mockGet).toHaveBeenCalled());
		await waitFor(() => expect(passkeyButton()).not.toHaveAttribute('data-loading'));
		expect(mockVerify).not.toHaveBeenCalled();
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		expect(screen.queryByText(/went wrong/)).not.toBeInTheDocument();
	});

	it('hides the button when the browser has no WebAuthn JSON helpers', () => {
		delete (window as { PublicKeyCredential?: unknown }).PublicKeyCredential;
		render(<LogIn />);
		expect(screen.queryByRole('button', { name: 'Continue with a passkey' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Continue with email' })).toBeInTheDocument();
	});

	it('lets the email field offer passkeys in its autofill menu', () => {
		render(<LogIn />);
		expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'username webauthn');
	});

	it('asks for an autofill passkey only when the browser supports it', async () => {
		render(<LogIn />);
		await waitFor(() => expect(mockConditionalAvailable).toHaveBeenCalled());
		await act(async () => {});
		expect(mockGetOptions).not.toHaveBeenCalled();
		expect(mockGet).not.toHaveBeenCalled();
	});

	it('signs in with the passkey picked from autofill, like the button', async () => {
		mockConditionalAvailable.mockResolvedValue(true);
		render(<LogIn />);
		await waitFor(() =>
			expect(mockGet).toHaveBeenCalledWith(expect.objectContaining({ publicKey: parsedOptions, mediation: 'conditional' }))
		);

		await act(async () => pickPasskey());

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/polls/p1'));
		expect(mockVerify).toHaveBeenCalledWith(credentialJson);
	});

	it('aborts the autofill request when the button is pressed, without an error', async () => {
		mockConditionalAvailable.mockResolvedValue(true);
		render(<LogIn />);
		await waitFor(() => expect(conditionalSignal).toBeDefined());

		fireEvent.click(passkeyButton());

		expect(conditionalSignal?.aborted).toBe(true);
		await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
		expect(mockVerify).toHaveBeenCalledTimes(1);
		expect(screen.queryByText(/went wrong/)).not.toBeInTheDocument();
	});

	it('aborts the autofill request when the page goes away', async () => {
		mockConditionalAvailable.mockResolvedValue(true);
		const { unmount } = render(<LogIn />);
		await waitFor(() => expect(conditionalSignal).toBeDefined());

		unmount();

		expect(conditionalSignal?.aborted).toBe(true);
		await act(async () => {});
		expect(mockVerify).not.toHaveBeenCalled();
	});
});
