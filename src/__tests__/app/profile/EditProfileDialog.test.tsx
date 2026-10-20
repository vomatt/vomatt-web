import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import EditProfileDialog from '@/app/(frontend)/[slug]/_components/EditProfileDialog';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));
const mockToastError = jest.fn();
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a), success: jest.fn() } }));
const mockEditProfile = jest.fn();
jest.mock('@/lib/api/services/users', () => ({
	editProfile: (...a: unknown[]) => mockEditProfile(...a),
}));

beforeEach(() => {
	jest.clearAllMocks();
	mockEditProfile.mockResolvedValue({ ok: true });
});

function open(initialUsername = 'mei') {
	render(<EditProfileDialog initialUsername={initialUsername} initialDisplayName="Mei" initialBio="" />);
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
		save();
		expect(mockEditProfile).not.toHaveBeenCalled();
		confirmRename();
		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/mei_lin'));
		expect(mockEditProfile).toHaveBeenCalledTimes(1);
		expect(mockEditProfile).toHaveBeenCalledWith({ username: 'mei_lin', displayName: 'Mei Lin', bio: '' });
	});

	it("doesn't rename a legacy mixed-case username on a case-only edit", async () => {
		open('Klaus');
		fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'Klaus' } });
		fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'hi' } });
		save();
		await waitFor(() => expect(mockEditProfile).toHaveBeenCalled());
		expect(mockEditProfile).toHaveBeenCalledWith({ username: undefined, displayName: 'Mei', bio: 'hi' });
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('asks before renaming, naming the links that will break', () => {
		open();
		fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'mei_lin' } });
		save();
		expect(screen.getByRole('heading', { name: 'Change your username?' })).toBeInTheDocument();
		expect(screen.getByText(/Links to \/mei will stop working/)).toBeInTheDocument();

		// Back returns to the form with the edit kept
		fireEvent.click(screen.getByRole('button', { name: 'Back' }));
		expect(screen.getByLabelText('Username')).toHaveValue('mei_lin');
		expect(mockEditProfile).not.toHaveBeenCalled();
	});

	it("doesn't ask when only the details change", async () => {
		open();
		fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'hi' } });
		save();
		await waitFor(() => expect(mockEditProfile).toHaveBeenCalled());
		expect(screen.queryByRole('heading', { name: 'Change your username?' })).not.toBeInTheDocument();
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

	it('drops abandoned edits when reopened', async () => {
		open();
		fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'draft' } });
		fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
		await waitFor(() => expect(screen.queryByLabelText('Bio')).not.toBeInTheDocument());
		fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
		expect(screen.getByLabelText('Bio')).toHaveValue('');
	});
});
