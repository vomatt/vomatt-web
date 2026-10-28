import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { AddPasskeyButton } from '@/features/passkeys/AddPasskeyButton';
import { getPasskeyRegistrationOptions, verifyPasskeyRegistration } from '@/lib/api/services/auth';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/lib/api/services/auth', () => ({
	getPasskeyRegistrationOptions: jest.fn(),
	verifyPasskeyRegistration: jest.fn(),
}));

const mockGetOptions = getPasskeyRegistrationOptions as jest.Mock;
const mockVerify = verifyPasskeyRegistration as jest.Mock;
const mockCreate = jest.fn();
const mockParse = jest.fn();

const optionsJson = { challenge: 'Y2hhbGxlbmdl', rp: { id: 'vomatt.com', name: 'Vomatt' } };
const parsedOptions = { challenge: new ArrayBuffer(8) };
const credentialJson = { id: 'cred-1', rawId: 'cred-1', type: 'public-key', response: {} };

function supportWebAuthn() {
	Object.defineProperty(window, 'PublicKeyCredential', {
		configurable: true,
		value: { parseCreationOptionsFromJSON: mockParse },
	});
	Object.defineProperty(navigator, 'credentials', { configurable: true, value: { create: mockCreate } });
}

beforeEach(() => {
	jest.clearAllMocks();
	mockParse.mockReturnValue(parsedOptions);
	mockGetOptions.mockResolvedValue({ ok: true, data: optionsJson });
	mockCreate.mockResolvedValue({ toJSON: () => credentialJson });
	mockVerify.mockResolvedValue({ ok: true, data: { id: 'p1', name: null, createdAt: '', lastUsedAt: null } });
	supportWebAuthn();
});

afterEach(() => {
	delete (window as { PublicKeyCredential?: unknown }).PublicKeyCredential;
	delete (navigator as { credentials?: unknown }).credentials;
});

const add = () => fireEvent.click(screen.getByRole('button', { name: 'Add passkey' }));

describe('AddPasskeyButton', () => {
	it('creates the passkey from the parsed options and sends its toJSON() to verify', async () => {
		render(<AddPasskeyButton />);
		add();

		await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Passkey added'));
		expect(mockParse).toHaveBeenCalledWith(optionsJson);
		expect(mockCreate).toHaveBeenCalledWith({ publicKey: parsedOptions });
		expect(mockVerify).toHaveBeenCalledWith(credentialJson);
	});

	it.each(['NotAllowedError', 'AbortError'])('says nothing when the user cancels (%s)', async (name) => {
		mockCreate.mockRejectedValue(new DOMException('cancelled', name));
		render(<AddPasskeyButton />);
		add();

		await waitFor(() => expect(mockCreate).toHaveBeenCalled());
		await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
		expect(toast.error).not.toHaveBeenCalled();
		expect(mockVerify).not.toHaveBeenCalled();
	});

	it('shows the error when verify fails', async () => {
		mockVerify.mockResolvedValue({ ok: false, status: 400, errorCode: 'auth.passkey.invalid', message: 'x' });
		render(<AddPasskeyButton />);
		add();

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith('Passkey verification failed. Please try again', { duration: Infinity })
		);
		expect(toast.success).not.toHaveBeenCalled();
	});

	it('says the passkey is already there when the device or the API reports a duplicate', async () => {
		mockCreate.mockRejectedValueOnce(new DOMException('exists', 'InvalidStateError'));
		mockVerify.mockResolvedValueOnce({ ok: false, status: 409, errorCode: 'common.conflict', message: 'x' });
		render(<AddPasskeyButton />);

		add();
		await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
		add();
		await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(2));
		const already = 'This device already has a passkey for your account.';
		expect(toast.error).toHaveBeenNthCalledWith(1, already, { duration: Infinity });
		expect(toast.error).toHaveBeenNthCalledWith(2, already, { duration: Infinity });
	});
});
