import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';

import { getSessions, revokeOtherSessions, revokeSession } from '@/features/sessions/service';
import { SessionsPanel } from '@/features/sessions/SessionsPanel';
import type { SignedInSession } from '@/types/user';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/features/sessions/service', () => ({
	getSessions: jest.fn(),
	revokeSession: jest.fn(),
	revokeOtherSessions: jest.fn(),
}));

const mockGetSessions = getSessions as jest.Mock;
const mockRevokeSession = revokeSession as jest.Mock;
const mockRevokeOthers = revokeOtherSessions as jest.Mock;

const mac: SignedInSession = {
	sessionId: 's1',
	userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',
	createdAt: '2026-10-20T08:00:00Z',
	lastSeenAt: '2026-10-29T03:00:00Z',
	current: true,
	adminScope: false,
};
const old: SignedInSession = {
	sessionId: 's2',
	userAgent: null,
	createdAt: null,
	lastSeenAt: null,
	current: false,
	adminScope: false,
};

beforeEach(() => {
	jest.clearAllMocks();
	mockGetSessions.mockResolvedValue({ ok: true, data: [mac, old] });
	mockRevokeSession.mockResolvedValue({ ok: true, data: undefined });
	mockRevokeOthers.mockResolvedValue({ ok: true, data: undefined });
});

const items = () => within(screen.getByRole('list')).getAllByRole('listitem');

describe('SessionsPanel', () => {
	it('lists devices, marks this one and shows an unknown device for an older sign-in', async () => {
		render(<SessionsPanel />);

		await waitFor(() => expect(items()).toHaveLength(2));
		expect(items()[0]).toHaveTextContent('Chrome · Mac');
		expect(items()[0]).toHaveTextContent('This device');
		expect(within(items()[0]).queryByRole('button')).not.toBeInTheDocument();
		expect(items()[1]).toHaveTextContent('Unknown device');
		expect(items()[1]).toHaveTextContent('activity unknown');
	});

	it('offers Try again when the list could not load', async () => {
		mockGetSessions.mockResolvedValueOnce({ ok: false, message: 'x' });
		render(<SessionsPanel />);

		fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
		await waitFor(() => expect(items()).toHaveLength(2));
	});

	it('signs out one device after a confirmation', async () => {
		render(<SessionsPanel />);
		await waitFor(() => expect(items()).toHaveLength(2));
		mockGetSessions.mockResolvedValue({ ok: true, data: [mac] });

		fireEvent.click(screen.getByRole('button', { name: 'Sign out Unknown device' }));
		fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Sign out' }));

		await waitFor(() => expect(mockRevokeSession).toHaveBeenCalledWith('s2'));
		await waitFor(() => expect(items()).toHaveLength(1));
		expect(toast.success).toHaveBeenCalled();
	});

	it('signs out the other devices and keeps this one', async () => {
		render(<SessionsPanel />);
		await waitFor(() => expect(items()).toHaveLength(2));
		mockGetSessions.mockResolvedValue({ ok: true, data: [mac] });

		fireEvent.click(screen.getByRole('button', { name: 'Sign out other devices' }));
		fireEvent.click(
			within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Sign out other devices' })
		);

		await waitFor(() => expect(mockRevokeOthers).toHaveBeenCalled());
		await waitFor(() => expect(items()).toHaveLength(1));
		expect(screen.queryByRole('button', { name: 'Sign out other devices' })).not.toBeInTheDocument();
	});

	it('shows an error and keeps the device when signing out fails', async () => {
		mockRevokeSession.mockResolvedValue({ ok: false, status: 500, message: 'boom' });
		render(<SessionsPanel />);
		await waitFor(() => expect(items()).toHaveLength(2));

		fireEvent.click(screen.getByRole('button', { name: 'Sign out Unknown device' }));
		fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Sign out' }));

		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		expect(items()).toHaveLength(2);
	});
});
