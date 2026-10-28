import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';

import { PasskeysPanel } from '@/features/passkeys/PasskeysPanel';
import { deletePasskey, getPasskeys } from '@/features/passkeys/service';
import { getPasskeyRegistrationOptions, verifyPasskeyRegistration } from '@/lib/api/services/auth';
import type { Passkey } from '@/types/user';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/features/passkeys/service', () => ({ getPasskeys: jest.fn(), deletePasskey: jest.fn() }));
jest.mock('@/lib/api/services/auth', () => ({
	getPasskeyRegistrationOptions: jest.fn(),
	verifyPasskeyRegistration: jest.fn(),
}));

const mockGetPasskeys = getPasskeys as jest.Mock;
const mockDeletePasskey = deletePasskey as jest.Mock;

const iphone: Passkey = {
	id: 'p1',
	name: 'iPhone',
	createdAt: '2026-10-01T08:00:00Z',
	lastUsedAt: '2026-10-20T08:00:00Z',
	transports: ['internal'],
};
const unnamed: Passkey = { id: 'p2', name: null, createdAt: '2026-10-02T08:00:00Z', lastUsedAt: null, transports: [] };

beforeEach(() => {
	jest.clearAllMocks();
	mockGetPasskeys.mockResolvedValue({ ok: true, data: [iphone, unnamed] });
	mockDeletePasskey.mockResolvedValue({ ok: true, data: undefined });
});

afterEach(() => {
	delete (window as { PublicKeyCredential?: unknown }).PublicKeyCredential;
	delete (navigator as { credentials?: unknown }).credentials;
});

const items = () => within(screen.getByRole('list')).getAllByRole('listitem');

describe('PasskeysPanel', () => {
	it('lists each passkey with its name, when it was added and when it was last used', async () => {
		render(<PasskeysPanel />);

		await waitFor(() => expect(items()).toHaveLength(2));
		expect(items()[0]).toHaveTextContent('iPhone');
		expect(items()[0]).toHaveTextContent(/Added Oct 1.*last used Oct 20/);
		expect(items()[1]).toHaveTextContent('Passkey');
		expect(items()[1]).toHaveTextContent(/Added Oct 2.*never used/);
	});

	it('says so when there are none', async () => {
		mockGetPasskeys.mockResolvedValue({ ok: true, data: [] });
		render(<PasskeysPanel />);
		expect(await screen.findByText('No passkeys yet.')).toBeInTheDocument();
		expect(screen.queryByRole('list')).not.toBeInTheDocument();
	});

	it('offers Try again when the list could not load', async () => {
		mockGetPasskeys.mockResolvedValueOnce({ ok: false, message: 'x' });
		render(<PasskeysPanel />);
		fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
		await waitFor(() => expect(items()).toHaveLength(2));
	});

	it('removes a passkey only after confirming, then drops it from the list', async () => {
		render(<PasskeysPanel />);
		fireEvent.click(await screen.findByRole('button', { name: 'Remove iPhone' }));
		expect(mockDeletePasskey).not.toHaveBeenCalled();

		const dialog = screen.getByRole('alertdialog');
		expect(dialog).toHaveTextContent('iPhone will no longer sign you in.');
		fireEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));

		await waitFor(() => expect(items()).toHaveLength(1));
		expect(mockDeletePasskey).toHaveBeenCalledWith('p1');
		expect(items()[0]).not.toHaveTextContent('iPhone');
		expect(toast.success).toHaveBeenCalledWith('Passkey removed');
	});

	it('keeps the passkey when Cancel is chosen', async () => {
		render(<PasskeysPanel />);
		fireEvent.click(await screen.findByRole('button', { name: 'Remove iPhone' }));
		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
		expect(mockDeletePasskey).not.toHaveBeenCalled();
		expect(items()).toHaveLength(2);
	});

	it('shows the error and keeps the list when removing fails', async () => {
		mockDeletePasskey.mockResolvedValue({ ok: false, status: 404, errorCode: 'common.not_found', message: 'x' });
		render(<PasskeysPanel />);
		fireEvent.click(await screen.findByRole('button', { name: 'Remove iPhone' }));
		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove' }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
		expect(items()).toHaveLength(2);
		expect(items()[0]).toHaveTextContent('iPhone');
		expect(toast.success).not.toHaveBeenCalled();
	});

	it('reloads the list after a passkey is added', async () => {
		Object.defineProperty(window, 'PublicKeyCredential', {
			configurable: true,
			value: { parseCreationOptionsFromJSON: jest.fn().mockReturnValue({}) },
		});
		Object.defineProperty(navigator, 'credentials', {
			configurable: true,
			value: { create: jest.fn().mockResolvedValue({ toJSON: () => ({ id: 'p3' }) }) },
		});
		(getPasskeyRegistrationOptions as jest.Mock).mockResolvedValue({ ok: true, data: {} });
		(verifyPasskeyRegistration as jest.Mock).mockResolvedValue({ ok: true, data: { id: 'p3' } });
		const mac: Passkey = { ...unnamed, id: 'p3', name: 'Mac' };
		render(<PasskeysPanel />);
		await waitFor(() => expect(items()).toHaveLength(2));

		mockGetPasskeys.mockResolvedValue({ ok: true, data: [iphone, unnamed, mac] });
		fireEvent.click(screen.getByRole('button', { name: 'Add passkey' }));

		await waitFor(() => expect(items()).toHaveLength(3));
		expect(mockGetPasskeys).toHaveBeenCalledTimes(2);
		expect(items()[2]).toHaveTextContent('Mac');
	});

	it('still lists passkeys, without Add passkey, when the browser has no WebAuthn', async () => {
		render(<PasskeysPanel />);
		await waitFor(() => expect(items()).toHaveLength(2));
		expect(screen.queryByRole('button', { name: 'Add passkey' })).not.toBeInTheDocument();
	});
});
