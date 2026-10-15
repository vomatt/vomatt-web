import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AvatarPicker } from '@/features/avatars/AvatarPicker';
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

const choose = (name: string) => fireEvent.click(screen.getByRole('button', { name: `Choose ${name}` }));

describe('AvatarPicker', () => {
	it('shows the username bot as already saved when nothing was chosen', () => {
		render(<AvatarPicker username="mei" avatarUrl={null} />);
		const kind = defaultBotFor('mei');
		expect(screen.getByRole('button', { name: `Choose ${en.avatar.bots[kind].name}` })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect(screen.getByRole('button', { name: 'Saved' })).toBeDisabled();
	});

	it('saves the picked bot', async () => {
		render(<AvatarPicker username="mei" avatarUrl="bot:boba" />);
		choose('Black Bear');
		expect(screen.getByText('A moon on its chest')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Save avatar' }));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Saved' })).toBeDisabled());
		expect(mockChooseAvatar).toHaveBeenCalledWith('bear');
	});

	it("keeps the choice unsaved and shows the API's message when saving fails", async () => {
		mockChooseAvatar.mockResolvedValue({ ok: false, message: 'Nope' });
		render(<AvatarPicker username="mei" avatarUrl="bot:boba" />);
		choose('Mazu');
		fireEvent.click(screen.getByRole('button', { name: 'Save avatar' }));
		await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Nope'));
		expect(screen.getByRole('button', { name: 'Save avatar' })).toBeEnabled();
	});

	it('Surprise me picks a different bot', () => {
		render(<AvatarPicker username="mei" avatarUrl="bot:boba" />);
		fireEvent.click(screen.getByRole('button', { name: 'Surprise me' }));
		expect(screen.getByRole('button', { name: 'Choose Boba' })).toHaveAttribute('aria-pressed', 'false');
		expect(screen.getByRole('button', { name: 'Save avatar' })).toBeEnabled();
	});
});
