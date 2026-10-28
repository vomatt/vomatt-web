import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';

import AccountSettings from '@/app/(frontend)/settings/_components/AccountSettings';
import type { MyProfile } from '@/types/user';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({ useTheme: () => ({ theme: 'system', setTheme: mockSetTheme }) }));
jest.mock('@/features/groups/GroupsPanel', () => ({ GroupsPanel: () => <p>Groups panel</p> }));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/lib/api/services/auth', () => ({ signout: jest.fn() }));
jest.mock('@/features/blocks/service', () => ({
	getBlockedUsers: jest.fn().mockResolvedValue({
		ok: true,
		data: {
			items: [
				{ id: 'b1', username: 'rvoss', displayName: 'R Voss', avatarUrl: null },
				{ id: 'b2', username: 'tpark', displayName: null, avatarUrl: null },
			],
			nextCursor: null,
		},
	}),
	unblockUser: jest.fn(),
}));
jest.mock('@/features/follows/service', () => ({
	getFollowedUsers: jest.fn().mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } }),
	unfollowUser: jest.fn(),
}));
jest.mock('@/features/passkeys/service', () => ({
	getPasskeys: jest.fn().mockResolvedValue({ ok: true, data: [] }),
	deletePasskey: jest.fn(),
}));
jest.mock('@/lib/api/services/users', () => ({
	deleteMyAccount: jest.fn(),
	editProfile: jest.fn(),
	exportMyData: jest.fn(),
}));
const mockUpdatePreferences = jest.fn();
jest.mock('@/features/notifications/service', () => ({
	updateNotificationPreferences: (...args: unknown[]) => mockUpdatePreferences(...args),
}));

const preferences = { resultsIn: true, invitations: true, comments: true, closingSoon: false };

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
	followersCount: 0,
	followingCount: 0,
	visibilitySettings: { points: true },
	avatarUrl: 'bot:boba',
	anonymousBallotByDefault: false,
};

describe('AccountSettings', () => {
	it('counts what others see and sends the owner to Edit profile to change it', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);

		// Display name and bio are public by default, points by choice
		const link = screen.getByRole('link', { name: /What others see/ });
		expect(link).toHaveTextContent('3 of 7 shown');
		expect(link).toHaveAttribute('href', '/mei?edit=1');
	});

	it('shows how many invite lists there are and opens them from Voting', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);
		const row = screen.getByRole('button', { name: /Invite lists/ });
		expect(row).toHaveTextContent('3 lists');
		fireEvent.click(row);
		expect(screen.getByText('Groups panel')).toBeInTheDocument();
	});

	it('counts one invite list in the singular, and leaves the count out when it could not load', () => {
		const { rerender } = render(<AccountSettings profile={myProfile} inviteListCount={1} notificationPreferences={preferences} />);
		expect(screen.getByRole('button', { name: /Invite lists/ })).toHaveTextContent('1 list');

		rerender(<AccountSettings profile={myProfile} inviteListCount={null} notificationPreferences={preferences} />);
		expect(screen.getByRole('button', { name: /Invite lists/ })).not.toHaveTextContent(/\d list/);
	});

	it('refreshes the invite list count once the lists are closed', async () => {
		mockRefresh.mockClear();
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);
		fireEvent.click(screen.getByRole('button', { name: /Invite lists/ }));
		fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
	});

	it('links Language to its own page, naming the current one', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);
		const row = screen.getByRole('link', { name: /Language/ });
		expect(row).toHaveAttribute('href', '/settings/language');
		expect(row).toHaveTextContent('English');
	});

	it('ends with the Terms and Privacy pages', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);
		const legal = screen.getByRole('navigation', { name: 'Legal' });
		expect(within(legal).getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms-of-service');
		expect(within(legal).getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy-policy');
	});

	it('picks the theme from a radio group', () => {
		mockSetTheme.mockClear();
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);
		const group = screen.getByRole('radiogroup', { name: 'Theme' });
		expect(within(group).getByRole('radio', { name: 'Auto' })).toBeChecked();

		fireEvent.click(within(group).getByRole('radio', { name: 'Dark' }));
		expect(mockSetTheme).toHaveBeenCalledWith('dark');
	});

	it('lists blocked people inside the privacy card, with their count', async () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);
		const card = screen.getByRole('link', { name: /What others see/ }).parentElement!;

		expect(await within(card).findByText('@rvoss')).toBeInTheDocument();
		const heading = within(card).getByRole('heading', { name: 'Blocked people' });
		expect(heading.nextElementSibling).toHaveTextContent('2');
		expect(within(card).getByText('@tpark')).toBeInTheDocument();
		expect(within(card).getAllByRole('button', { name: 'Unblock' })).toHaveLength(2);
	});

	it('keeps the Following panel below the privacy card', async () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);
		const card = screen.getByRole('link', { name: /What others see/ }).parentElement!;
		const following = await screen.findByRole('heading', { name: 'Following' });
		expect(card).not.toContainElement(following);
		expect(screen.getByText('You aren’t following anyone.')).toBeInTheDocument();
	});

	it('keeps the Download your data row', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);
		expect(screen.getByText('Download your data')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
	});

	describe('the Passkeys row', () => {
		afterEach(() => {
			delete (window as { PublicKeyCredential?: unknown }).PublicKeyCredential;
			delete (navigator as { credentials?: unknown }).credentials;
		});

		it('offers Add passkey when the browser has WebAuthn with the JSON helpers', () => {
			Object.defineProperty(window, 'PublicKeyCredential', {
				configurable: true,
				value: { parseCreationOptionsFromJSON: jest.fn() },
			});
			Object.defineProperty(navigator, 'credentials', { configurable: true, value: { create: jest.fn() } });
			render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);
			expect(screen.getByText('Passkeys')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Add passkey' })).toBeInTheDocument();
		});

		it('lists passkeys but hides Add passkey without PublicKeyCredential', async () => {
			render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);
			const account = screen.getByRole('region', { name: 'Account' });
			expect(await within(account).findByText('No passkeys yet.')).toBeInTheDocument();
			expect(screen.queryByRole('button', { name: 'Add passkey' })).not.toBeInTheDocument();
		});

		it('is hidden when PublicKeyCredential predates parseCreationOptionsFromJSON', () => {
			Object.defineProperty(window, 'PublicKeyCredential', { configurable: true, value: {} });
			Object.defineProperty(navigator, 'credentials', { configurable: true, value: { create: jest.fn() } });
			render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);
			expect(screen.queryByRole('button', { name: 'Add passkey' })).not.toBeInTheDocument();
		});
	});

	it('lets the owner vote anonymously by default from Settings', async () => {
		const { editProfile } = jest.requireMock('@/lib/api/services/users');
		editProfile.mockResolvedValue({ ok: true });
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);

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
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);

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
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);

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
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);

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
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);

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
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);

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
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);

		const toggle = screen.getByRole('switch', { name: 'Vote anonymously by default' });
		fireEvent.click(toggle);
		fireEvent.click(toggle);
		await act(async () => {
			answers[0]({ ok: false, message: '' });
			answers[1]({ ok: false, message: '' });
		});
		expect(toggle).not.toBeChecked();
	});

	it('shows a switch per notification kind, Closing soon off by default, between Voting and Appearance', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);
		const section = screen.getByRole('region', { name: 'Notifications' });
		const switches = within(section).getAllByRole('switch');
		expect(switches.map((s) => s.getAttribute('aria-checked'))).toEqual(['true', 'true', 'true', 'false']);
		expect(within(section).getByRole('switch', { name: 'Comments on your polls' })).toHaveAccessibleDescription(
			'When someone makes their case under a poll you asked.'
		);
		expect(within(section).queryByText(/Push/)).not.toBeInTheDocument();
		expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent).slice(0, 3)).toEqual([
			'Voting',
			'Notifications',
			'Appearance and language',
		]);
	});

	it('saves a notification switch on its own', async () => {
		mockUpdatePreferences.mockResolvedValue({ ok: true, data: { ...preferences, closingSoon: true } });
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);

		const toggle = screen.getByRole('switch', { name: 'Closing soon' });
		fireEvent.click(toggle);
		expect(toggle).toBeChecked();
		expect(mockUpdatePreferences).toHaveBeenCalledWith({ closingSoon: true });
		await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Closing soon notifications on.'));
	});

	it('puts a notification switch back when the save fails', async () => {
		mockUpdatePreferences.mockResolvedValue({ ok: false, message: 'x' });
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);

		const toggle = screen.getByRole('switch', { name: 'Results are in' });
		fireEvent.click(toggle);
		expect(toggle).not.toBeChecked();
		await waitFor(() => expect(toggle).toBeChecked());
		expect(toast.error).toHaveBeenCalled();
	});

	it('rolls back only the switch that failed when two saves overlap', async () => {
		const answers: ((value: unknown) => void)[] = [];
		mockUpdatePreferences.mockImplementation(() => new Promise((resolve) => answers.push(resolve)));
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);

		const invitations = screen.getByRole('switch', { name: 'Invitations' });
		const comments = screen.getByRole('switch', { name: 'Comments on your polls' });
		fireEvent.click(invitations);
		fireEvent.click(comments);
		await act(async () => {
			answers[0]({ ok: true, data: { ...preferences, invitations: false } });
			answers[1]({ ok: false, message: '' });
		});
		expect(invitations).not.toBeChecked();
		expect(comments).toBeChecked();
	});

	it('says so when the notification settings could not be loaded', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={null} />);
		const section = screen.getByRole('region', { name: 'Notifications' });
		expect(section).toHaveTextContent('Couldn’t load your notification settings.');
		expect(within(section).queryByRole('switch')).not.toBeInTheDocument();
	});

	it.each([
		['admin.last_admin', 'You are the only active admin. Make someone else an admin before deleting your account.'],
		['common.conflict', 'Another change is in progress. Try again in a moment.'],
	])('explains a refused deletion (%s)', async (errorCode, message) => {
		const { deleteMyAccount } = jest.requireMock('@/lib/api/services/users');
		deleteMyAccount.mockResolvedValue({ ok: false, status: 409, errorCode, message: 'raw' });
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} />);

		fireEvent.click(screen.getByRole('button', { name: 'Delete account…' }));
		fireEvent.change(screen.getByRole('textbox', { name: 'Type your username to confirm' }), {
			target: { value: 'mei' },
		});
		fireEvent.click(screen.getAllByRole('button', { name: 'Delete account' }).at(-1)!);
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message, { duration: Infinity }));
	});
});
