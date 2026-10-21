import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import AccountSettings from '@/app/(frontend)/settings/_components/AccountSettings';
import type { MyProfile } from '@/types/user';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/lib/api/services/auth', () => ({ signout: jest.fn() }));
jest.mock('@/lib/api/services/users', () => ({
	deleteMyAccount: jest.fn(),
	updateVisibility: jest.fn(),
	editProfile: jest.fn(),
}));

// Base UI's Switch dispatches a PointerEvent on click
window.PointerEvent = window.PointerEvent || (MouseEvent as any);

const myProfile: MyProfile = {
	id: 'u1',
	username: 'mei',
	email: 'mei@example.com',
	phoneNumber: null,
	firstName: null,
	lastName: null,
	birthday: null,
	displayName: 'Mei',
	bio: 'Poll enthusiast',
	location: 'Taipei',
	points: 120,
	membershipLevel: null,
	active: true,
	lastLoginAt: null,
	joinedAt: '2026-08-01T10:00:00Z',
	totalPolls: 3,
	totalVotes: 12,
	visibilitySettings: { points: true },
	avatarUrl: 'bot:boba',
	anonymousBallotByDefault: false,
};

describe('AccountSettings', () => {
	it('shows each visibility switch with its saved value', () => {
		render(<AccountSettings profile={myProfile} />);

		expect(screen.getByRole('switch', { name: 'Points' })).toBeChecked();
		expect(screen.getByRole('switch', { name: 'Location' })).not.toBeChecked();
		// Public by default when the settings leave them out
		expect(screen.getByRole('switch', { name: 'Display name' })).toBeChecked();
	});

	it('lets the owner vote anonymously by default from Settings', async () => {
		const { editProfile } = jest.requireMock('@/lib/api/services/users');
		editProfile.mockResolvedValue({ ok: true });
		render(<AccountSettings profile={myProfile} />);

		const toggle = screen.getByRole('switch', { name: 'Vote anonymously by default' });
		expect(toggle).not.toBeChecked();
		fireEvent.click(toggle);
		expect(editProfile).toHaveBeenCalledWith({ anonymousBallotByDefault: true });
		await waitFor(() => expect(toggle).toBeChecked());
		await waitFor(() =>
			expect(screen.getByRole('status')).toHaveTextContent('New votes are anonymous by default.')
		);
	});

	it('announces a saved visibility change', async () => {
		const { updateVisibility } = jest.requireMock('@/lib/api/services/users');
		updateVisibility.mockResolvedValue({ points: true, location: true });
		render(<AccountSettings profile={myProfile} />);

		fireEvent.click(screen.getByRole('switch', { name: 'Location' }));
		await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Location is now visible to others.'));
		expect(screen.getByRole('switch', { name: 'Location' })).toBeChecked();
	});

	it('rolls back only the field whose save failed', async () => {
		const { updateVisibility } = jest.requireMock('@/lib/api/services/users');
		const answers: Record<string, { resolve: (v: unknown) => void; reject: (e: unknown) => void }> = {};
		updateVisibility.mockImplementation(
			(change: Record<string, boolean>) =>
				new Promise((resolve, reject) => (answers[Object.keys(change)[0]] = { resolve, reject }))
		);
		render(<AccountSettings profile={myProfile} />);
		const location = screen.getByRole('switch', { name: 'Location' });
		const bio = screen.getByRole('switch', { name: 'Bio' });

		fireEvent.click(location);
		fireEvent.click(bio);
		// Bio saves first, then Location's earlier save fails
		await act(async () => answers.bio.resolve({ points: true, bio: false }));
		await act(async () => answers.location.reject(new Error('down')));

		expect(location).not.toBeChecked();
		// The failure doesn't undo Bio's save
		expect(bio).not.toBeChecked();
		expect(toast.error).toHaveBeenCalledWith("Couldn’t save. Try again.", { duration: Infinity });
	});

	it('shows the delete button as busy while the account is deleted', async () => {
		const { deleteMyAccount } = jest.requireMock('@/lib/api/services/users');
		deleteMyAccount.mockReturnValue(new Promise(() => {}));
		render(<AccountSettings profile={myProfile} />);

		fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
		fireEvent.change(screen.getByRole('textbox', { name: 'Type your username to confirm' }), {
			target: { value: 'mei' },
		});
		const confirm = screen.getAllByRole('button', { name: 'Delete account' }).at(-1)!;
		fireEvent.click(confirm);
		await waitFor(() => expect(confirm).toHaveAttribute('aria-busy', 'true'));
	});

	it('says the account is still active when deletion fails without a reason', async () => {
		const { deleteMyAccount } = jest.requireMock('@/lib/api/services/users');
		deleteMyAccount.mockResolvedValue({ ok: false, status: 502, message: 'Request failed with status 502' });
		render(<AccountSettings profile={myProfile} />);

		fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
		fireEvent.change(screen.getByRole('textbox', { name: 'Type your username to confirm' }), {
			target: { value: 'mei' },
		});
		fireEvent.click(screen.getAllByRole('button', { name: 'Delete account' }).at(-1)!);
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Couldn’t delete your account. It’s still active; try again.", { duration: Infinity })
		);
	});

	it('keeps Delete reachable and explains a mismatched confirmation', () => {
		const { deleteMyAccount } = jest.requireMock('@/lib/api/services/users');
		deleteMyAccount.mockClear();
		render(<AccountSettings profile={myProfile} />);

		fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
		const input = screen.getByRole('textbox', { name: 'Type your username to confirm' });
		fireEvent.change(input, { target: { value: 'me' } });
		const confirm = screen.getAllByRole('button', { name: 'Delete account' }).at(-1)!;
		expect(confirm).toBeEnabled();
		fireEvent.click(confirm);

		expect(deleteMyAccount).not.toHaveBeenCalled();
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input).toHaveAccessibleDescription('Type mei to delete your account.');
		expect(input).toHaveFocus();
	});

	it('accepts the username in any case', async () => {
		const { deleteMyAccount } = jest.requireMock('@/lib/api/services/users');
		deleteMyAccount.mockResolvedValue({ ok: false, message: '' });
		render(<AccountSettings profile={myProfile} />);

		fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
		fireEvent.change(screen.getByRole('textbox', { name: 'Type your username to confirm' }), {
			target: { value: ' MEI ' },
		});
		fireEvent.click(screen.getAllByRole('button', { name: 'Delete account' }).at(-1)!);
		await waitFor(() => expect(deleteMyAccount).toHaveBeenCalled());
	});

	it('falls back to the saved default when quick toggles both fail', async () => {
		const { editProfile } = jest.requireMock('@/lib/api/services/users');
		const answers: ((value: { ok: boolean; message: string }) => void)[] = [];
		editProfile.mockImplementation(() => new Promise((resolve) => answers.push(resolve)));
		render(<AccountSettings profile={myProfile} />);

		const toggle = screen.getByRole('switch', { name: 'Vote anonymously by default' });
		fireEvent.click(toggle);
		fireEvent.click(toggle);
		await act(async () => {
			answers[0]({ ok: false, message: '' });
			answers[1]({ ok: false, message: '' });
		});
		expect(toggle).not.toBeChecked();
	});

	it.each([
		['admin.last_admin', 'You are the only active admin. Make someone else an admin before deleting your account.'],
		['common.conflict', 'Another change is in progress. Try again in a moment.'],
	])('explains a refused deletion (%s)', async (errorCode, message) => {
		const { deleteMyAccount } = jest.requireMock('@/lib/api/services/users');
		deleteMyAccount.mockResolvedValue({ ok: false, status: 409, errorCode, message: 'raw' });
		render(<AccountSettings profile={myProfile} />);

		fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
		fireEvent.change(screen.getByRole('textbox', { name: 'Type your username to confirm' }), {
			target: { value: 'mei' },
		});
		fireEvent.click(screen.getAllByRole('button', { name: 'Delete account' }).at(-1)!);
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message, { duration: Infinity }));
	});
});
