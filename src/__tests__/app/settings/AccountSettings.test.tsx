import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';

import AccountSettings, { SETTINGS_SECTIONS, SettingsNav } from '@/app/(frontend)/settings/_components/AccountSettings';
import type { MyProfile } from '@/types/user';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({ useTheme: () => ({ theme: 'system', setTheme: mockSetTheme }) }));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn(), info: jest.fn() } }));
jest.mock('@/lib/api/services/auth', () => ({ signout: jest.fn() }));
const mockReportProblem = jest.fn();
jest.mock('@/features/feedback/service', () => ({ reportProblem: (...args: unknown[]) => mockReportProblem(...args) }));
jest.mock('@/features/passkeys/service', () => ({
	getPasskeys: jest.fn().mockResolvedValue({ ok: true, data: [] }),
	deletePasskey: jest.fn(),
}));
jest.mock('@/lib/api/services/users', () => ({
	deleteMyAccount: jest.fn(),
	editProfile: jest.fn(),
	sendPhoneBindOtp: jest.fn(),
	verifyPhoneBind: jest.fn(),
}));
const mockUnlock = jest.fn();
jest.mock('@/features/communities/service', () => ({
	createCommunity: jest.fn(),
	keepCommunities: jest.fn(),
	unlockCommunity: (...args: unknown[]) => mockUnlock(...args),
}));
const mockGetSessions = jest.fn();
jest.mock('@/features/sessions/service', () => ({ getSessions: () => mockGetSessions() }));
const mockUpdatePreferences = jest.fn();
jest.mock('@/features/notifications/service', () => ({
	updateNotificationPreferences: (...args: unknown[]) => mockUpdatePreferences(...args),
}));

const preferences = { resultsIn: true, invitations: true, comments: true, mentions: true, likes: true, closingSoon: false };

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
	active: true,
	lastLoginAt: null,
	joinedAt: '2026-08-01T10:00:00Z',
	totalPolls: 3,
	totalVotes: 12,
	createdPollCount: 3,
	votedPollCount: 12,
	followersCount: 0,
	followingCount: 0,
	visibilitySettings: { points: true, firstName: false, lastName: true },
	avatarUrl: 'bot:boba',
	anonymousBallotByDefault: false,
};

describe('AccountSettings', () => {
	beforeEach(() => {
		mockGetSessions.mockReset().mockResolvedValue({ ok: true, data: [{}, {}] });
	});

	it('counts what others see and opens its own page to change it', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);

		// Display name and bio are public by default; the real name shows through its last half; gender is hidden by default; points no page shows
		const link = screen.getByRole('link', { name: /What others see/ });
		expect(link).toHaveTextContent('3 of 4 shown');
		expect(link).toHaveAttribute('href', '/settings/visibility');
	});

	it('shows the phone number by state: add, verify, or verified', () => {
		const { rerender } = render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		expect(screen.getByRole('button', { name: 'Add phone number' })).toBeInTheDocument();

		rerender(<AccountSettings profile={{ ...myProfile, phoneNumber: '+886912345678', phoneVerified: false }} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		expect(screen.getByRole('button', { name: 'Verify' })).toBeInTheDocument();

		rerender(<AccountSettings profile={{ ...myProfile, phoneNumber: '+886912345678', phoneVerified: true }} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		expect(screen.queryByRole('button', { name: 'Verify' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Add phone number' })).not.toBeInTheDocument();
		expect(screen.getByText('Verified')).toBeInTheDocument();
	});

	it('opens the phone dialog from the row', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		fireEvent.click(screen.getByRole('button', { name: 'Add phone number' }));
		expect(screen.getByRole('dialog', { name: 'Add your phone number' })).toBeInTheDocument();
	});

	it('shows how many invite lists there are and links to their page from Voting', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		const row = screen.getByRole('link', { name: /Invite lists/ });
		expect(row).toHaveAttribute('href', '/settings/invite-lists');
		expect(row).toHaveTextContent('3 lists');
	});

	it('counts one invite list in the singular, and leaves the count out when it could not load', () => {
		const { rerender } = render(<AccountSettings profile={myProfile} inviteListCount={1} notificationPreferences={preferences} communities={[]} />);
		expect(screen.getByRole('link', { name: /Invite lists/ })).toHaveTextContent('1 list');

		rerender(<AccountSettings profile={myProfile} inviteListCount={null} notificationPreferences={preferences} communities={[]} />);
		expect(screen.getByRole('link', { name: /Invite lists/ })).not.toHaveTextContent(/\d list/);
	});

	it('links Language to its own page, naming the current one', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		const row = screen.getByRole('link', { name: /Language/ });
		expect(row).toHaveAttribute('href', '/settings/language');
		expect(row).toHaveTextContent('English');
	});

	it('ends with the Terms and Privacy pages', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		const legal = screen.getByRole('navigation', { name: 'Legal' });
		expect(within(legal).getByRole('link', { name: 'Terms' })).toHaveAttribute('href', 'https://about.vomatt.com/terms-of-service');
		expect(within(legal).getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', 'https://about.vomatt.com/privacy-policy');
	});

	it('picks the theme from a radio group', () => {
		mockSetTheme.mockClear();
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		const group = screen.getByRole('radiogroup', { name: 'Theme' });
		expect(within(group).getByRole('radio', { name: 'Auto' })).toBeChecked();

		fireEvent.click(within(group).getByRole('radio', { name: 'Dark' }));
		expect(mockSetTheme).toHaveBeenCalledWith('dark');
	});

	it('opens Blocked people on its own page from Privacy', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		const privacy = screen.getByRole('region', { name: 'Privacy and safety' });
		expect(within(privacy).getByRole('link', { name: /Blocked people/ })).toHaveAttribute('href', '/settings/blocked');
		expect(within(privacy).queryByRole('button', { name: /^Unblock/ })).not.toBeInTheDocument();
	});

	it('sends a report from Help and closes the dialog once it is sent', async () => {
		mockReportProblem.mockResolvedValue({ ok: true, data: null });
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		const help = screen.getByRole('region', { name: 'Help' });
		fireEvent.click(within(help).getByRole('button', { name: /Report a problem/ }));
		const dialog = screen.getByRole('dialog', { name: 'Report a problem' });

		fireEvent.change(within(dialog).getByRole('textbox', { name: 'Describe the problem' }), { target: { value: 'Ballot froze' } });
		fireEvent.click(within(dialog).getByRole('button', { name: 'Submit' }));

		expect(mockReportProblem).toHaveBeenCalledWith('Ballot froze');
		await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Report a problem' })).not.toBeInTheDocument());
	});

	it('leaves the people you follow to your profile', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		expect(screen.queryByRole('heading', { name: 'Following' })).not.toBeInTheDocument();
	});

	it('opens Signed-in devices on its own page, with how many there are', async () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		const link = screen.getByRole('link', { name: /Signed-in devices/ });
		expect(link).toHaveAttribute('href', '/settings/devices');
		await waitFor(() => expect(link).toHaveTextContent('2 devices'));
		expect(screen.queryByText('Download your data')).not.toBeInTheDocument();
	});

	it('counts one device in the singular, and leaves the count out when the devices could not load', async () => {
		mockGetSessions.mockResolvedValueOnce({ ok: true, data: [{}] });
		const { unmount } = render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		await waitFor(() => expect(screen.getByRole('link', { name: /Signed-in devices/ })).toHaveTextContent('1 device'));
		unmount();

		mockGetSessions.mockResolvedValueOnce({ ok: false, message: 'x' });
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		await waitFor(() => expect(mockGetSessions).toHaveBeenCalledTimes(2));
		expect(screen.getByRole('link', { name: /Signed-in devices/ })).not.toHaveTextContent(/\d device/);
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
			render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
			expect(screen.getByText('Passkeys')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Add passkey' })).toBeInTheDocument();
		});

		it('lists passkeys but hides Add passkey without PublicKeyCredential', async () => {
			render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
			const account = screen.getByRole('region', { name: 'Account' });
			expect(await within(account).findByText('No passkeys yet.')).toBeInTheDocument();
			expect(screen.queryByRole('button', { name: 'Add passkey' })).not.toBeInTheDocument();
		});

		it('is hidden when PublicKeyCredential predates parseCreationOptionsFromJSON', () => {
			Object.defineProperty(window, 'PublicKeyCredential', { configurable: true, value: {} });
			Object.defineProperty(navigator, 'credentials', { configurable: true, value: { create: jest.fn() } });
			render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
			expect(screen.queryByRole('button', { name: 'Add passkey' })).not.toBeInTheDocument();
		});
	});

	it('lets the owner vote anonymously by default from Settings', async () => {
		const { editProfile } = jest.requireMock('@/lib/api/services/users');
		editProfile.mockResolvedValue({ ok: true });
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);

		const toggle = screen.getByRole('switch', { name: 'Vote anonymously by default' });
		expect(toggle).not.toBeChecked();
		fireEvent.click(toggle);
		expect(editProfile).toHaveBeenCalledWith({ anonymousBallotByDefault: true });
		await waitFor(() => expect(toggle).toBeChecked());
		await waitFor(() =>
			expect(screen.getByRole('status')).toHaveTextContent('New votes are anonymous by default.')
		);
	});

	it('shows the delete button as busy while the account is deleted', async () => {
		const { deleteMyAccount } = jest.requireMock('@/lib/api/services/users');
		deleteMyAccount.mockReturnValue(new Promise(() => {}));
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);

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
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);

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
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);

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
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);

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
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);

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
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		const section = screen.getByRole('region', { name: 'Notifications' });
		const switches = within(section).getAllByRole('switch');
		expect(switches.map((s) => s.getAttribute('aria-checked'))).toEqual(['true', 'true', 'true', 'true', 'true', 'false']);
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
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);

		const toggle = screen.getByRole('switch', { name: 'Closing soon' });
		fireEvent.click(toggle);
		expect(toggle).toBeChecked();
		expect(mockUpdatePreferences).toHaveBeenCalledWith({ closingSoon: true });
		await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Closing soon notifications on.'));
	});

	it('puts a notification switch back when the save fails', async () => {
		mockUpdatePreferences.mockResolvedValue({ ok: false, message: 'x' });
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);

		const toggle = screen.getByRole('switch', { name: 'Results are in' });
		fireEvent.click(toggle);
		expect(toggle).not.toBeChecked();
		await waitFor(() => expect(toggle).toBeChecked());
		expect(toast.error).toHaveBeenCalled();
	});

	it('rolls back only the switch that failed when two saves overlap', async () => {
		const answers: ((value: unknown) => void)[] = [];
		mockUpdatePreferences.mockImplementation(() => new Promise((resolve) => answers.push(resolve)));
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);

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
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={null} communities={[]} />);
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
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);

		fireEvent.click(screen.getByRole('button', { name: 'Delete account…' }));
		fireEvent.change(screen.getByRole('textbox', { name: 'Type your username to confirm' }), {
			target: { value: 'mei' },
		});
		fireEvent.click(screen.getAllByRole('button', { name: 'Delete account' }).at(-1)!);
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message, { duration: Infinity }));
	});

	it('sends the only owner of a community account to hand it over before deleting', async () => {
		const { deleteMyAccount } = jest.requireMock('@/lib/api/services/users');
		deleteMyAccount.mockResolvedValue({ ok: false, status: 409, errorCode: 'community.last_owner', message: 'raw' });
		const communities = [{ communityId: 'off1', username: 'sunrise', displayName: 'Sunrise', avatarUrl: null, role: 'OWNER' as const }];
		render(
			<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={communities} />
		);
		expect(screen.getByRole('link', { name: /Sunrise/ })).toHaveAttribute('href', '/settings/communities/off1/members');
		fireEvent.click(screen.getByRole('button', { name: 'Delete account…' }));
		fireEvent.change(screen.getByRole('textbox', { name: 'Type your username to confirm' }), { target: { value: 'mei' } });
		fireEvent.click(screen.getAllByRole('button', { name: 'Delete account' }).at(-1)!);
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				'You’re the only owner of a community account. Transfer ownership first.',
				expect.objectContaining({ action: expect.objectContaining({ label: 'Community accounts' }) })
			)
		);
		expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
	});

	it('offers creating a community account when the user has none, with no list', () => {
		render(<AccountSettings profile={myProfile} inviteListCount={3} notificationPreferences={preferences} communities={[]} />);
		const section = screen.getByRole('region', { name: 'Community accounts' });
		expect(within(section).queryByRole('list')).not.toBeInTheDocument();
		fireEvent.click(within(section).getByRole('button', { name: /Create a community account/ }));
		expect(screen.getByRole('dialog', { name: 'Create a community account' })).toBeInTheDocument();
	});

	const quota = (owned: number, limit: number) => ({ owned, limit, selectionRequired: false, selectionDeadline: null });

	it('shows the plan and how many community accounts it allows', () => {
		const { rerender } = render(
			<AccountSettings profile={{ ...myProfile, plan: 'FREE', communityQuota: quota(0, 1) }} inviteListCount={3} notificationPreferences={preferences} communities={[]} />
		);
		const plan = screen.getByRole('region', { name: 'Plan' });
		expect(plan).toHaveTextContent('Free plan');
		expect(plan).toHaveTextContent('0 of 1 community accounts owned');
		expect(within(plan).getByRole('button', { name: 'Upgrade to Pro' })).toBeInTheDocument();

		rerender(
			<AccountSettings profile={{ ...myProfile, plan: 'PRO', communityQuota: quota(2, 3) }} inviteListCount={3} notificationPreferences={preferences} communities={[]} />
		);
		expect(plan).toHaveTextContent('Pro plan');
		expect(plan).toHaveTextContent('2 of 3 community accounts owned');
		expect(within(plan).queryByRole('button', { name: 'Upgrade to Pro' })).not.toBeInTheDocument();
	});

	it('turns Create into an upgrade once a Free user owns their limit, and says Pro is coming soon', async () => {
		render(
			<AccountSettings profile={{ ...myProfile, plan: 'FREE', communityQuota: quota(1, 1) }} inviteListCount={3} notificationPreferences={preferences} communities={[]} />
		);
		const section = screen.getByRole('region', { name: 'Community accounts' });
		expect(within(section).queryByRole('button', { name: /Create a community account/ })).not.toBeInTheDocument();
		expect(section).toHaveTextContent('You own as many community accounts as your plan allows');
		fireEvent.click(within(section).getByRole('button', { name: 'Upgrade to Pro' }));
		await waitFor(() => expect(toast.info).toHaveBeenCalledWith('Pro is coming soon.'));
	});

	const locked = { communityId: 'off2', username: 'harbor', displayName: 'Harbor', avatarUrl: null, role: 'OWNER' as const, locked: true };

	it('marks a locked account and unlocks it while the plan has room', async () => {
		mockUnlock.mockResolvedValue({ ok: true, data: undefined });
		render(
			<AccountSettings profile={{ ...myProfile, plan: 'PRO', communityQuota: quota(2, 3) }} inviteListCount={3} notificationPreferences={preferences} communities={[locked]} />
		);
		const section = screen.getByRole('region', { name: 'Community accounts' });
		expect(within(section).getByRole('link', { name: /Harbor/ })).toHaveTextContent('Locked');
		fireEvent.click(within(section).getByRole('button', { name: 'Unlock Harbor' }));
		await waitFor(() => expect(mockUnlock).toHaveBeenCalledWith('off2'));
		expect(mockRefresh).toHaveBeenCalled();
	});

	it('offers no Unlock when the plan is full', () => {
		render(
			<AccountSettings profile={{ ...myProfile, plan: 'FREE', communityQuota: quota(1, 1) }} inviteListCount={3} notificationPreferences={preferences} communities={[locked]} />
		);
		expect(screen.getByRole('link', { name: /Harbor/ })).toHaveTextContent('Locked');
		expect(screen.queryByRole('button', { name: 'Unlock Harbor' })).not.toBeInTheDocument();
	});

	it('asks which accounts to keep, by when, until the user chooses', () => {
		const selection = { owned: 3, limit: 1, selectionRequired: true, selectionDeadline: '2026-11-18T10:00:00Z' };
		render(
			<AccountSettings profile={{ ...myProfile, plan: 'FREE', communityQuota: selection }} inviteListCount={3} notificationPreferences={preferences} communities={[{ ...locked, locked: false }]} />
		);
		const plan = screen.getByRole('region', { name: 'Plan' });
		expect(plan).toHaveTextContent('You own more community accounts than your plan allows');
		expect(plan).toHaveTextContent('Choose by Nov 18, 2026');
		fireEvent.click(within(plan).getByRole('button', { name: 'Choose' }));
		expect(screen.getByRole('dialog', { name: 'Choose which community accounts to keep' })).toBeInTheDocument();
	});

	it('offers no upgrade to a Pro user at their limit', () => {
		render(
			<AccountSettings profile={{ ...myProfile, plan: 'PRO', communityQuota: quota(3, 3) }} inviteListCount={3} notificationPreferences={preferences} communities={[]} />
		);
		const section = screen.getByRole('region', { name: 'Community accounts' });
		expect(section).toHaveTextContent('To create another, transfer ownership of one you own.');
		expect(within(section).queryByRole('button')).not.toBeInTheDocument();
	});
});

describe('SettingsNav', () => {
	// Section tops, relative to the viewport, as jsdom has no layout
	const tops: Record<string, number> = {};
	let pageHeight = 3000;
	const faked = [
		[window, 'innerHeight'],
		[window, 'scrollY'],
		[document.documentElement, 'scrollHeight'],
	] as const;
	const originals = faked.map(([target, key]) => Object.getOwnPropertyDescriptor(target, key));

	beforeEach(() => {
		jest.useFakeTimers();
		for (const [index, id] of SETTINGS_SECTIONS.entries()) tops[id] = 100 + index * 500;
		pageHeight = 3000;
		Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, get: () => pageHeight });
		Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
		Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
	});

	afterEach(() => {
		jest.useRealTimers();
		faked.forEach(([target, key], index) => {
			const original = originals[index];
			if (original) Object.defineProperty(target, key, original);
			else delete (target as unknown as Record<string, unknown>)[key];
		});
	});

	const renderNav = () =>
		render(
			<>
				{SETTINGS_SECTIONS.map((id) => (
					<section
						key={id}
						id={id}
						ref={(element) => {
							if (element) element.getBoundingClientRect = () => ({ top: tops[id] }) as DOMRect;
						}}
					/>
				))}
				<SettingsNav />
			</>
		);

	// Scroll events are measured on the next frame
	const scrollTo = (y: number) =>
		act(() => {
			for (const id of SETTINGS_SECTIONS) tops[id] -= y - window.scrollY;
			window.scrollY = y;
			window.dispatchEvent(new Event('scroll'));
			jest.advanceTimersByTime(20);
		});

	const marked = () =>
		screen.getAllByRole('link').find((link) => link.getAttribute('aria-current') === 'location')?.textContent;

	it('marks the section whose top has passed the top of the viewport', () => {
		renderNav();
		expect(marked()).toBe('Voting');
		scrollTo(1000);
		expect(marked()).toBe('Appearance and language');
	});

	it('marks the last section at the bottom of the page, though its top never reaches the top', () => {
		renderNav();
		scrollTo(2000);
		expect(marked()).toBe('Account');
	});

	it('marks the first section when the whole page fits the viewport', () => {
		pageHeight = 1000;
		renderNav();
		expect(marked()).toBe('Voting');
	});

	it('marks a clicked section even when the page cannot scroll it to the top', () => {
		renderNav();
		scrollTo(2000);
		fireEvent.click(screen.getByRole('link', { name: 'Privacy and safety' }));
		// The jump lands where the page already was
		scrollTo(2000);
		expect(marked()).toBe('Privacy and safety');
		// Any scroll away from there, by hand or by Back, follows the page again
		scrollTo(1000);
		expect(marked()).toBe('Appearance and language');
	});

	it('leaves the mark alone when a link is opened elsewhere with a modifier', () => {
		renderNav();
		fireEvent.click(screen.getByRole('link', { name: 'Account' }), { metaKey: true });
		expect(marked()).toBe('Voting');
	});
});
