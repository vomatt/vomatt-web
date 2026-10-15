import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import EditProfileDialog from '@/app/(frontend)/[slug]/_components/EditProfileDialog';

global.ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
} as any;

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
	fireEvent.click(screen.getByRole('button', { name: 'Edit Profile' }));
}
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

describe('EditProfileDialog', () => {
	it('closes without a request when nothing changed', async () => {
		open();
		save();
		await waitFor(() => expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument());
		expect(mockEditProfile).not.toHaveBeenCalled();
	});

	it('saves username and details in one request, then moves to the new URL', async () => {
		open();
		fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'Mei_Lin' } });
		fireEvent.change(screen.getByLabelText('Display Name'), { target: { value: 'Mei Lin' } });
		save();
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

	it("shows the API's message and stays open when saving fails", async () => {
		mockEditProfile.mockResolvedValue({ ok: false, message: 'Username taken' });
		open();
		fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'bob' } });
		save();
		await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Username taken'));
		expect(mockReplace).not.toHaveBeenCalled();
		expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
	});
});
