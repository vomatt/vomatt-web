import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AvatarDialog } from '@/features/avatars/AvatarDialog';
import { defaultBotFor } from '@/features/avatars/catalog';
import en from '@/locales/en.json';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockToastError = jest.fn();
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a), success: jest.fn() } }));
const mockChooseAvatar = jest.fn();
const mockUploadAvatar = jest.fn();
jest.mock('@/features/avatars/service', () => ({
	chooseAvatar: (...a: unknown[]) => mockChooseAvatar(...a),
	uploadAvatar: (...a: unknown[]) => mockUploadAvatar(...a),
}));
// Records where each tile tooltip may be placed; jsdom has no layout to show it
const mockTooltipBoundaries: unknown[] = [];
jest.mock('@/components/ui/Tooltip', () => {
	const actual = jest.requireActual('@/components/ui/Tooltip');
	return {
		...actual,
		TooltipContent: (props: { collisionBoundary?: unknown }) => {
			mockTooltipBoundaries.push(props.collisionBoundary);
			return actual.TooltipContent(props);
		},
	};
});

beforeEach(() => {
	jest.clearAllMocks();
	mockTooltipBoundaries.length = 0;
	mockChooseAvatar.mockResolvedValue({ ok: true, data: undefined });
	mockUploadAvatar.mockResolvedValue({ ok: true, data: undefined });
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
		// Enabled even when unchanged; saving nothing just closes
		fireEvent.click(screen.getByRole('button', { name: 'Save avatar' }));
		expect(mockChooseAvatar).not.toHaveBeenCalled();
	});

	it('saves the picked bot and closes', async () => {
		openDialog('bot:boba');
		choose('Black Bear');
		expect(screen.getByText('A moon on its chest')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Save avatar' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(mockChooseAvatar).toHaveBeenCalledWith('bear');
	});

	it('removes the avatar, saving the account icon', async () => {
		openDialog('bot:boba');
		fireEvent.click(screen.getByRole('button', { name: 'Remove avatar' }));
		expect(screen.getByText('Account icon')).toBeInTheDocument();
		expect(screen.getByText('Just you, no character')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Save avatar' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(mockChooseAvatar).toHaveBeenCalledWith('none');
	});

	it('shows the account icon as already saved, with nothing left to remove', () => {
		openDialog('bot:none');
		expect(screen.getByText('Just you, no character')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /^Choose /, pressed: true })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Remove avatar' })).toHaveAttribute('aria-disabled', 'true');
	});

	it('starts again from the saved bot after closing without saving', async () => {
		openDialog('bot:boba');
		choose('Mazu');
		fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		fireEvent.click(screen.getByRole('button', { name: 'Change avatar' }));
		expect(screen.getByRole('button', { name: 'Choose Boba' })).toHaveAttribute('aria-pressed', 'true');
	});

	it("keeps the choice unsaved and shows the error when saving fails", async () => {
		mockChooseAvatar.mockResolvedValue({ ok: false, errorCode: 'common.rate_limited', message: 'raw' });
		openDialog('bot:boba');
		choose('Mazu');
		fireEvent.click(screen.getByRole('button', { name: 'Save avatar' }));
		await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Too many requests, please try again later', { duration: Infinity }));
		expect(screen.getByRole('button', { name: 'Save avatar' })).toBeEnabled();
	});

	it('recovers when the request to save never reaches the server', async () => {
		mockChooseAvatar.mockRejectedValue(new TypeError('Failed to fetch'));
		openDialog('bot:boba');
		choose('Mazu');
		fireEvent.click(screen.getByRole('button', { name: 'Save avatar' }));
		await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Couldn’t save. Try again.", { duration: Infinity }));
		expect(screen.getByRole('button', { name: 'Save avatar' })).toBeEnabled();
	});

	it("keeps tile tooltips inside the scrolling grid, off the dialog's header", () => {
		openDialog('bot:boba');
		const grid = screen.getByRole('button', { name: 'Choose Boba' }).closest('.overflow-y-auto');
		expect(grid).not.toBeNull();
		expect(mockTooltipBoundaries.length).toBeGreaterThan(0);
		expect(mockTooltipBoundaries.at(-1)).toBe(grid);
	});

	it('Surprise me picks a different bot', () => {
		openDialog('bot:boba');
		fireEvent.click(screen.getByRole('button', { name: 'Surprise me' }));
		expect(screen.getByRole('button', { name: 'Choose Boba' })).toHaveAttribute('aria-pressed', 'false');
		expect(screen.getByRole('button', { name: 'Save avatar' })).toBeEnabled();
	});

	describe('upload', () => {
		const pick = (file: File) => fireEvent.change(screen.getByTestId('avatar-file'), { target: { files: [file] } });

		it('uploads a chosen photo', async () => {
			openDialog(null);
			pick(new File(['x'], 'me.png', { type: 'image/png' }));
			await waitFor(() => expect(mockUploadAvatar).toHaveBeenCalled());
			expect((mockUploadAvatar.mock.calls[0][0] as FormData).get('file')).toBeInstanceOf(File);
		});

		it('rejects a wrong type or an oversized photo without a request', async () => {
			openDialog(null);
			pick(new File(['x'], 'me.webp', { type: 'image/webp' }));
			await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(en.avatar.upload.unsupported, expect.anything()));
			pick(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }));
			await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(en.avatar.upload.tooLarge, expect.anything()));
			expect(mockUploadAvatar).not.toHaveBeenCalled();
		});

		it("shows the API's error for a failed upload", async () => {
			mockUploadAvatar.mockResolvedValue({ ok: false, errorCode: 'user.avatar.unsupported_image', message: 'x' });
			openDialog(null);
			pick(new File(['x'], 'me.png', { type: 'image/png' }));
			await waitFor(() =>
				expect(mockToastError).toHaveBeenCalledWith(en.apiError.user.avatar.unsupported_image, expect.anything())
			);
		});

		it('saves a bot over an uploaded photo', async () => {
			const bot = defaultBotFor('mei');
			openDialog('/api/avatars/abc.jpg');
			fireEvent.click(screen.getByRole('button', { name: `Choose ${en.avatar.bots[bot].name}` }));
			fireEvent.click(screen.getByRole('button', { name: 'Save avatar' }));
			await waitFor(() => expect(mockChooseAvatar).toHaveBeenCalledWith(bot));
		});
	});
});
