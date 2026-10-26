import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import AccountSettings from '@/app/(frontend)/settings/_components/AccountSettings';
import type { MyProfile } from '@/types/user';

const mockSetLanguage = jest.fn();
jest.mock('@/contexts/LanguageContext', () => {
	const actual = jest.requireActual('../../helpers/mockLanguage');
	return { ...actual, useLanguage: () => ({ ...actual.useLanguage(), setLanguage: mockSetLanguage }) };
});
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
jest.mock('next-themes', () => ({ useTheme: () => ({ theme: 'system', setTheme: jest.fn() }) }));
jest.mock('@/features/groups/GroupsPanel', () => ({ GroupsPanel: () => <p>Groups panel</p> }));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/lib/api/services/auth', () => ({ signout: jest.fn() }));
jest.mock('@/features/blocks/service', () => ({
	getBlockedUsers: jest.fn().mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } }),
	unblockUser: jest.fn(),
}));
jest.mock('@/features/follows/service', () => ({
	getFollowedUsers: jest.fn().mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } }),
	unfollowUser: jest.fn(),
}));
jest.mock('@/features/notifications/service', () => ({
	getNotificationPreferences: jest
		.fn()
		.mockResolvedValue({ ok: true, data: { resultsIn: true, invitations: true, comments: true, closingSoon: false } }),
	updateNotificationPreferences: jest.fn(),
}));
jest.mock('@/lib/api/services/users', () => ({
	deleteMyAccount: jest.fn(),
	editProfile: jest.fn(),
	exportMyData: jest.fn(),
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
	it('counts what others see and sends the owner to Edit profile to change it', () => {
		render(<AccountSettings profile={myProfile} />);

		// Display name and bio are public by default, points by choice
		const link = screen.getByRole('link', { name: /What others can see/ });
		expect(link).toHaveTextContent('3 of 7 shown');
		expect(link).toHaveAttribute('href', '/mei?edit=1');
	});

	it('opens the invite lists from Voting', () => {
		render(<AccountSettings profile={myProfile} />);
		fireEvent.click(screen.getByRole('button', { name: /Invite Lists/ }));
		expect(screen.getByText('Groups panel')).toBeInTheDocument();
	});

	it('switches the language and re-renders the page in it', () => {
		render(<AccountSettings profile={myProfile} />);
		fireEvent.click(screen.getByRole('button', { name: '繁體中文' }));
		expect(mockSetLanguage).toHaveBeenCalledWith('zh');
		expect(mockRefresh).toHaveBeenCalled();
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

	it('downloads the exported data, or shows why it failed', async () => {
		const { exportMyData } = jest.requireMock('@/lib/api/services/users');
		URL.createObjectURL = jest.fn(() => 'blob:x');
		URL.revokeObjectURL = jest.fn();
		const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
		render(<AccountSettings profile={myProfile} />);

		exportMyData.mockResolvedValueOnce({ ok: true, data: '{}' });
		fireEvent.click(screen.getByRole('button', { name: 'Download' }));
		await waitFor(() => expect(click).toHaveBeenCalled());

		exportMyData.mockResolvedValueOnce({ ok: false, status: 429, errorCode: 'common.rate_limited', message: 'x' });
		fireEvent.click(screen.getByRole('button', { name: 'Download' }));
		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		click.mockRestore();
	});

	it('shows the delete button as busy while the account is deleted', async () => {
		const { deleteMyAccount } = jest.requireMock('@/lib/api/services/users');
		deleteMyAccount.mockReturnValue(new Promise(() => {}));
		render(<AccountSettings profile={myProfile} />);

		fireEvent.click(screen.getByRole('button', { name: 'Delete account…' }));
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

		fireEvent.click(screen.getByRole('button', { name: 'Delete account…' }));
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

		fireEvent.click(screen.getByRole('button', { name: 'Delete account…' }));
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

		fireEvent.click(screen.getByRole('button', { name: 'Delete account…' }));
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

		fireEvent.click(screen.getByRole('button', { name: 'Delete account…' }));
		fireEvent.change(screen.getByRole('textbox', { name: 'Type your username to confirm' }), {
			target: { value: 'mei' },
		});
		fireEvent.click(screen.getAllByRole('button', { name: 'Delete account' }).at(-1)!);
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message, { duration: Infinity }));
	});
});
