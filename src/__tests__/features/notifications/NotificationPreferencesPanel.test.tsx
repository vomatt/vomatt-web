import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { NotificationPreferencesPanel } from '@/features/notifications/NotificationPreferencesPanel';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockToastError = jest.fn();
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a) } }));
const mockGet = jest.fn();
const mockUpdate = jest.fn();
jest.mock('@/features/notifications/service', () => ({
	getNotificationPreferences: (...a: unknown[]) => mockGet(...a),
	updateNotificationPreferences: (...a: unknown[]) => mockUpdate(...a),
}));

// Base UI's Switch dispatches a PointerEvent on click
window.PointerEvent = window.PointerEvent || (MouseEvent as any);

const prefs = { resultsIn: true, invitations: true, comments: true, closingSoon: false };

beforeEach(() => jest.clearAllMocks());

it('shows the four switches as the API has them', async () => {
	mockGet.mockResolvedValue({ ok: true, data: prefs });
	render(<NotificationPreferencesPanel />);

	expect(await screen.findByRole('switch', { name: 'Comments' })).toBeChecked();
	expect(screen.getByRole('switch', { name: 'Closing soon' })).not.toBeChecked();
	expect(screen.getByRole('switch', { name: 'Results' })).toBeChecked();
	expect(screen.getByRole('switch', { name: 'Invitations' })).toBeChecked();
});

it('saves the switch that was flipped', async () => {
	mockGet.mockResolvedValue({ ok: true, data: prefs });
	mockUpdate.mockResolvedValue({ ok: true, data: { ...prefs, closingSoon: true } });
	render(<NotificationPreferencesPanel />);

	fireEvent.click(await screen.findByRole('switch', { name: 'Closing soon' }));
	expect(screen.getByRole('switch', { name: 'Closing soon' })).toBeChecked();
	await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith({ closingSoon: true }));
});

it('puts the switch back and says so when saving fails', async () => {
	mockGet.mockResolvedValue({ ok: true, data: prefs });
	mockUpdate.mockResolvedValue({ ok: false, message: 'nope' });
	render(<NotificationPreferencesPanel />);

	fireEvent.click(await screen.findByRole('switch', { name: 'Comments' }));
	await waitFor(() => expect(mockToastError).toHaveBeenCalled());
	expect(screen.getByRole('switch', { name: 'Comments' })).toBeChecked();
});

it('offers a retry when the settings cannot be loaded', async () => {
	mockGet.mockResolvedValueOnce({ ok: false, message: 'down' }).mockResolvedValue({ ok: true, data: prefs });
	render(<NotificationPreferencesPanel />);

	expect(await screen.findByText('Couldn’t load your notification settings.')).toBeInTheDocument();
	fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
	expect(await screen.findByRole('switch', { name: 'Results' })).toBeInTheDocument();
});
