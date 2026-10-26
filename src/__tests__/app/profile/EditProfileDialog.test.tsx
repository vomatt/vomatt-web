import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import EditProfileDialog from '@/app/(frontend)/[slug]/_components/EditProfileDialog';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockReplace = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }) }));
const mockToastError = jest.fn();
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a), success: jest.fn() } }));
const mockEditProfile = jest.fn();
const mockUpdateVisibility = jest.fn();
jest.mock('@/lib/api/services/users', () => ({
	editProfile: (...a: unknown[]) => mockEditProfile(...a),
	updateVisibility: (...a: unknown[]) => mockUpdateVisibility(...a),
}));
jest.mock('@/features/avatars/AvatarDialog', () => ({ AvatarDialog: () => null }));

beforeEach(() => {
	jest.clearAllMocks();
	mockEditProfile.mockResolvedValue({ ok: true });
	mockUpdateVisibility.mockResolvedValue({});
});

const profile = {
	id: 'u1',
	username: 'mei',
	email: null,
	phoneNumber: null,
	firstName: null,
	lastName: null,
	birthday: null,
	displayName: 'Mei',
	bio: null,
	location: 'Taipei',
	points: 1240,
	membershipLevel: null,
	active: true,
	lastLoginAt: null,
	joinedAt: '2026-01-01T00:00:00Z',
	totalPolls: 0,
	totalVotes: 0,
	followersCount: 0,
	followingCount: 0,
	visibilitySettings: {},
	anonymousBallotByDefault: false,
	avatarUrl: null,
};

function open(username = 'mei') {
	render(<EditProfileDialog profile={{ ...profile, username }} />);
	fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
}
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
const confirmRename = () => fireEvent.click(screen.getByRole('button', { name: 'Change username' }));

describe('EditProfileDialog', () => {
	it('closes without a request when nothing changed', async () => {
		open();
		save();
		await waitFor(() => expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument());
		expect(mockEditProfile).not.toHaveBeenCalled();
	});

	it('saves username and details in one request, then moves to the new URL', async () => {
		open();
		fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'Mei_Lin' } });
		fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Mei Lin' } });
		expect(screen.getByLabelText('Username')).toHaveAccessibleDescription(/Your profile moves to \/mei_lin/);
		save();
		expect(mockEditProfile).not.toHaveBeenCalled();
		confirmRename();
		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/mei_lin'));
		expect(mockEditProfile).toHaveBeenCalledTimes(1);
		expect(mockEditProfile).toHaveBeenCalledWith({ username: 'mei_lin', displayName: 'Mei Lin',
			bio: '',
			firstName: undefined,
			lastName: undefined,
			birthday: undefined,
		});
	});

	it('saves names and a changed birthday, and rejects one out of range', async () => {
		open();
		fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Mei' } });
		fireEvent.change(screen.getByLabelText('Birthday'), { target: { value: '1899-12-31' } });
		save();
		expect(await screen.findByText('Pick a date between 1900 and yesterday.')).toBeInTheDocument();
		expect(mockEditProfile).not.toHaveBeenCalled();
		fireEvent.change(screen.getByLabelText('Birthday'), { target: { value: '1990-05-01' } });
		save();
		await waitFor(() => expect(mockEditProfile).toHaveBeenCalled());
		expect(mockEditProfile).toHaveBeenCalledWith({
			username: undefined,
			displayName: 'Mei',
			bio: '',
			firstName: 'Mei',
			lastName: undefined,
			birthday: '1990-05-01',
		});
	});

	it("doesn't rename a legacy mixed-case username on a case-only edit", async () => {
		open('Klaus');
		fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'Klaus' } });
		fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'hi' } });
		save();
		await waitFor(() => expect(mockEditProfile).toHaveBeenCalled());
		expect(mockEditProfile).toHaveBeenCalledWith({ username: undefined, displayName: 'Mei',
			bio: 'hi',
			firstName: undefined,
			lastName: undefined,
			birthday: undefined,
		});
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('warns under the field, before saving, which links a new username breaks', () => {
		open();
		fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'mei_lin' } });
		expect(screen.getByLabelText('Username')).toHaveAccessibleDescription(
			'Your profile moves to /mei_lin. Links to /mei stop working, including ones you’ve shared.'
		);
		expect(mockEditProfile).not.toHaveBeenCalled();
	});

	it('shows the address before the username, inside its field', () => {
		open();
		const input = screen.getByLabelText('Username');
		expect(input).toHaveValue('mei');
		expect(input.parentElement).toHaveTextContent('vomatt.com/');
	});

	it('counts the bio against its limit', () => {
		open();
		fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'hi' } });
		expect(screen.getByLabelText('Bio')).toHaveAccessibleDescription('2 / 500');
	});

	it('shows an invalid username under its field, without a request', () => {
		open();
		fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'ab' } });
		save();
		const input = screen.getByLabelText('Username');
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input).toHaveAccessibleDescription('Usernames are 3–50 lowercase letters, numbers or underscores.');
		expect(mockEditProfile).not.toHaveBeenCalled();
		expect(mockToastError).not.toHaveBeenCalled();

		// Editing clears it
		fireEvent.change(input, { target: { value: 'abc' } });
		expect(input).toHaveAttribute('aria-invalid', 'false');
	});

	it('says a reserved username is reserved, not badly formatted', () => {
		open();
		fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'settings' } });
		save();
		expect(screen.getByLabelText('Username')).toHaveAccessibleDescription('settings is reserved. Choose another username.');
		expect(mockEditProfile).not.toHaveBeenCalled();
	});

	it('shows a taken username under its field and stays open', async () => {
		mockEditProfile.mockResolvedValue({ ok: false, errorCode: 'user.username.taken', message: 'raw' });
		open();
		fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'bob' } });
		save();
		confirmRename();
		await waitFor(() =>
			expect(screen.getByLabelText('Username')).toHaveAccessibleDescription('Username already taken')
		);
		expect(mockToastError).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('shows other failures as a toast and stays open', async () => {
		mockEditProfile.mockResolvedValue({ ok: false, errorCode: 'common.conflict', message: 'raw' });
		open();
		fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'hi' } });
		save();
		await waitFor(() => expect(mockToastError).toHaveBeenCalled());
		expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
	});

	it('saves only the visibility that changed, beside the field', async () => {
		open();
		fireEvent.click(screen.getByRole('button', { name: 'Location: only you see it. Change' }));
		fireEvent.click(screen.getByRole('button', { name: 'Bio: everyone sees it. Change' }));
		save();
		await waitFor(() => expect(mockUpdateVisibility).toHaveBeenCalledWith({ bio: false, location: true }));
		expect(mockEditProfile).not.toHaveBeenCalled();
		expect(mockRefresh).toHaveBeenCalled();
	});

	it('asks before renaming, and Back keeps the edit without a request', () => {
		open();
		fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'mei_lin' } });
		save();
		expect(screen.getByRole('heading', { name: 'Change your username?' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Back' }));
		expect(screen.getByLabelText('Username')).toHaveValue('mei_lin');
		expect(mockEditProfile).not.toHaveBeenCalled();
	});

	it('still moves to the new username when only the visibility save fails, and says so', async () => {
		mockUpdateVisibility.mockRejectedValue(new Error('down'));
		open();
		fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'mei_lin' } });
		fireEvent.click(screen.getByRole('button', { name: 'Location: only you see it. Change' }));
		save();
		confirmRename();
		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/mei_lin'));
		expect(mockToastError).toHaveBeenCalledWith('Your details were saved, but who sees them wasn’t. Try again.', {
			duration: Infinity,
		});
	});

	it('switches first and last name together as the real name', async () => {
		open();
		fireEvent.click(screen.getByRole('button', { name: 'Real name: only you see it. Change' }));
		save();
		await waitFor(() => expect(mockUpdateVisibility).toHaveBeenCalledWith({ firstName: true, lastName: true }));
	});

	it('names each pill by its detail and who sees it, and the label follows a switch', () => {
		open();
		expect(screen.getByRole('button', { name: 'Display name: everyone sees it. Change' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Points: only you see them. Change' }));
		expect(screen.getByRole('button', { name: 'Points: everyone sees them. Change' })).toBeInTheDocument();
	});

	it('drops abandoned edits when reopened', async () => {
		open();
		fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'draft' } });
		fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
		await waitFor(() => expect(screen.queryByLabelText('Bio')).not.toBeInTheDocument());
		fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
		expect(screen.getByLabelText('Bio')).toHaveValue('');
	});
});
