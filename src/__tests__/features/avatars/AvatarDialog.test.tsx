import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AvatarDialog } from '@/features/avatars/AvatarDialog';
import { defaultBotFor } from '@/features/avatars/catalog';
import en from '@/locales/en.json';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockToastError = jest.fn();
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a), success: jest.fn() } }));
const mockChooseAvatar = jest.fn();
jest.mock('@/features/avatars/service', () => ({
	chooseAvatar: (...a: unknown[]) => mockChooseAvatar(...a),
}));

beforeEach(() => {
	jest.clearAllMocks();
	mockChooseAvatar.mockResolvedValue({ ok: true, data: undefined });
});

const openDialog = (avatarUrl: string | null) => {
	render(<AvatarDialog username="mei" avatarUrl={avatarUrl} />);
	fireEvent.click(screen.getByRole('button', { name: 'Change avatar' }));
};
const choose = (name: string) => fireEvent.click(screen.getByRole('button', { name: `Choose ${name}` }));

describe('AvatarDialog', () => {
	it('shows the username bot as already saved when nothing was chosen', () => {
		openDialog(null);
		const kind = defaultBotFor('mei');
		expect(screen.getByRole('button', { name: `Choose ${en.avatar.bots[kind].name}` })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect(screen.getByRole('button', { name: 'Save avatar' })).toBeDisabled();
	});

	it('saves the picked bot and closes', async () => {
		openDialog('bot:boba');
		choose('Black Bear');
		expect(screen.getByText('A moon on its chest')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Save avatar' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(mockChooseAvatar).toHaveBeenCalledWith('bear');
	});

	it('starts again from the saved bot after closing without saving', async () => {
		openDialog('bot:boba');
		choose('Mazu');
		fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		fireEvent.click(screen.getByRole('button', { name: 'Change avatar' }));
		expect(screen.getByRole('button', { name: 'Choose Boba' })).toHaveAttribute('aria-pressed', 'true');
	});

	it("keeps the choice unsaved and shows the API's message when saving fails", async () => {
		mockChooseAvatar.mockResolvedValue({ ok: false, message: 'Nope' });
		openDialog('bot:boba');
		choose('Mazu');
		fireEvent.click(screen.getByRole('button', { name: 'Save avatar' }));
		await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Nope'));
		expect(screen.getByRole('button', { name: 'Save avatar' })).toBeEnabled();
	});

	it('recovers when the request to save never reaches the server', async () => {
		mockChooseAvatar.mockRejectedValue(new TypeError('Failed to fetch'));
		openDialog('bot:boba');
		choose('Mazu');
		fireEvent.click(screen.getByRole('button', { name: 'Save avatar' }));
		await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Couldn't save. Try again."));
		expect(screen.getByRole('button', { name: 'Save avatar' })).toBeEnabled();
	});

	it('Surprise me picks a different bot', () => {
		openDialog('bot:boba');
		fireEvent.click(screen.getByRole('button', { name: 'Surprise me' }));
		expect(screen.getByRole('button', { name: 'Choose Boba' })).toHaveAttribute('aria-pressed', 'false');
		expect(screen.getByRole('button', { name: 'Save avatar' })).toBeEnabled();
	});
});
