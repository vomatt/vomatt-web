import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AvatarDialog } from '@/features/avatars/AvatarDialog';
import { defaultBotFor } from '@/features/avatars/catalog';
import { ActingProvider } from '@/features/communities/ActingProvider';
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
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
const mockUploadCommunityAvatar = jest.fn();
jest.mock('@/features/communities/service', () => ({
	uploadCommunityAvatar: (...a: unknown[]) => mockUploadCommunityAvatar(...a),
}));
jest.mock('@/features/communities/acting', () => ({ actAsCommunity: jest.fn(), loadMyCommunities: jest.fn() }));
const mockCropToJpeg = jest.fn();
jest.mock('@/features/avatars/cropImage', () => ({ cropToJpeg: (...a: unknown[]) => mockCropToJpeg(...a) }));
// jsdom can't lay out or decode an image; the stub reports a fixed crop once mounted, as the cropper does after load
const CROP_AREA = { x: 40, y: 10, width: 300, height: 300 };
jest.mock('react-easy-crop', () => {
	const { useEffect } = jest.requireActual('react');
	return {
		__esModule: true,
		default: function MockCropper({
			image,
			onCropComplete,
		}: {
			image: string;
			onCropComplete: (area: unknown, pixels: unknown) => void;
		}) {
			useEffect(() => onCropComplete({ x: 0, y: 0, width: 100, height: 100 }, CROP_AREA), [onCropComplete]);
			return <div data-testid="cropper" data-src={image} />;
		},
	};
});
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
	mockCropToJpeg.mockResolvedValue(new Blob(['jpeg'], { type: 'image/jpeg' }));
	URL.createObjectURL = jest.fn(() => 'blob:picked');
	URL.revokeObjectURL = jest.fn();
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

	describe('upload', () => {
		const pick = (file: File) => fireEvent.change(screen.getByTestId('avatar-file'), { target: { files: [file] } });

		const usePhoto = () => fireEvent.click(screen.getByRole('button', { name: 'Use photo' }));

		it('shows the crop step for a picked photo without uploading it', async () => {
			openDialog(null);
			pick(new File(['x'], 'me.png', { type: 'image/png' }));
			expect(await screen.findByRole('heading', { name: en.avatar.crop.title })).toBeInTheDocument();
			expect(await screen.findByTestId('cropper')).toHaveAttribute('data-src', 'blob:picked');
			expect(screen.queryByRole('button', { name: 'Save avatar' })).not.toBeInTheDocument();
			expect(mockUploadAvatar).not.toHaveBeenCalled();
		});

		it('uploads the framed crop as a JPEG and closes', async () => {
			const jpeg = new Blob(['cropped'], { type: 'image/jpeg' });
			mockCropToJpeg.mockResolvedValue(jpeg);
			openDialog(null);
			pick(new File(['x'], 'me.png', { type: 'image/png' }));
			usePhoto();
			await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
			expect(mockCropToJpeg).toHaveBeenCalledWith('blob:picked', CROP_AREA);
			const sent = (mockUploadAvatar.mock.calls[0][0] as FormData).get('file') as File;
			expect(sent.name).toBe('avatar.jpg');
			expect(sent.type).toBe('image/jpeg');
			// jsdom's File has no text()
			const body = await new Promise((resolve) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result);
				reader.readAsText(sent);
			});
			expect(body).toBe('cropped');
			expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:picked');
		});

		it('uploads to the community’s own avatar while acting as it', async () => {
			mockUploadCommunityAvatar.mockResolvedValue({ ok: true, data: undefined });
			const sunrise = { communityId: 'c1', username: 'sunrise', displayName: 'Sunrise', avatarUrl: null, role: 'ADMIN' as const };
			render(
				<ActingProvider state={{ acting: sunrise, me: null, communities: [sunrise], stale: false }}>
					<AvatarDialog username="sunrise" avatarUrl={null} />
				</ActingProvider>
			);
			fireEvent.click(screen.getByRole('button', { name: 'Change avatar' }));
			pick(new File(['x'], 'logo.png', { type: 'image/png' }));
			usePhoto();
			await waitFor(() => expect(mockUploadCommunityAvatar).toHaveBeenCalledWith('c1', expect.any(FormData)));
			expect(mockUploadAvatar).not.toHaveBeenCalled();
		});

		it('Cancel goes back to the cast without uploading', () => {
			openDialog(null);
			pick(new File(['x'], 'me.png', { type: 'image/png' }));
			fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
			expect(screen.getByRole('heading', { name: en.avatar.title })).toBeInTheDocument();
			expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:picked');
			expect(mockUploadAvatar).not.toHaveBeenCalled();
		});

		it('starts from the cast again after closing mid-crop', async () => {
			openDialog(null);
			pick(new File(['x'], 'me.png', { type: 'image/png' }));
			fireEvent.click(screen.getByRole('button', { name: 'Close' }));
			await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
			expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:picked');
			fireEvent.click(screen.getByRole('button', { name: 'Change avatar' }));
			expect(screen.getByRole('heading', { name: en.avatar.title })).toBeInTheDocument();
		});

		it('rejects a wrong type without a crop step or a request', async () => {
			openDialog(null);
			pick(new File(['x'], 'me.webp', { type: 'image/webp' }));
			await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(en.avatar.upload.unsupported, expect.anything()));
			expect(screen.queryByRole('heading', { name: en.avatar.crop.title })).not.toBeInTheDocument();
			expect(URL.createObjectURL).not.toHaveBeenCalled();
			expect(mockUploadAvatar).not.toHaveBeenCalled();
		});

		it('rejects a photo over 25 MB without a crop step or a request', async () => {
			openDialog(null);
			const huge = new File(['x'], 'huge.jpg', { type: 'image/jpeg' });
			Object.defineProperty(huge, 'size', { value: 25 * 1024 * 1024 + 1 });
			pick(huge);
			await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(en.avatar.upload.tooLarge, expect.anything()));
			expect(screen.queryByRole('heading', { name: en.avatar.crop.title })).not.toBeInTheDocument();
			expect(mockUploadAvatar).not.toHaveBeenCalled();
		});

		it("returns to the cast when the photo can't be decoded", async () => {
			mockCropToJpeg.mockRejectedValue(new Error('EncodingError'));
			openDialog(null);
			pick(new File(['x'], 'me.png', { type: 'image/png' }));
			usePhoto();
			await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(en.avatar.upload.unsupported, expect.anything()));
			expect(screen.getByRole('heading', { name: en.avatar.title })).toBeInTheDocument();
			expect(mockUploadAvatar).not.toHaveBeenCalled();
		});

		it("shows the API's error for a failed upload", async () => {
			mockUploadAvatar.mockResolvedValue({ ok: false, errorCode: 'user.avatar.unsupported_image', message: 'x' });
			openDialog(null);
			pick(new File(['x'], 'me.png', { type: 'image/png' }));
			usePhoto();
			await waitFor(() =>
				expect(mockToastError).toHaveBeenCalledWith(en.apiError.user.avatar.unsupported_image, expect.anything())
			);
			expect(screen.getByRole('button', { name: 'Use photo' })).toBeEnabled();
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
