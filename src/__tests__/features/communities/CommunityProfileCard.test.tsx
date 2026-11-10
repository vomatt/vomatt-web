import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { CommunityProfileCard } from '@/features/communities/CommunityProfileCard';
import type { CommunityRole, MyCommunity } from '@/features/communities/schema';
import en from '@/locales/en.json';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
const mockUpdate = jest.fn();
const mockUpload = jest.fn();
jest.mock('@/features/communities/service', () => ({
	updateCommunity: (...a: unknown[]) => mockUpdate(...a),
	uploadCommunityAvatar: (...a: unknown[]) => mockUpload(...a),
}));
jest.mock('@/features/avatars/cropImage', () => ({
	cropToJpeg: () => Promise.resolve(new Blob(['cropped'], { type: 'image/jpeg' })),
}));
// One object, so reporting it again on every render settles
const CROP_AREA = { x: 0, y: 0, width: 10, height: 10 };
jest.mock('react-easy-crop', () => {
	const { useEffect } = jest.requireActual('react');
	return {
		__esModule: true,
		default: function MockCropper({ onCropComplete }: { onCropComplete: (area: unknown, pixels: unknown) => void }) {
			useEffect(() => onCropComplete({}, CROP_AREA), [onCropComplete]);
			return null;
		},
	};
});

beforeEach(() => {
	jest.clearAllMocks();
	mockUpdate.mockResolvedValue({ ok: true, data: undefined });
	mockUpload.mockResolvedValue({ ok: true, data: undefined });
	URL.createObjectURL = jest.fn(() => 'blob:picked');
	URL.revokeObjectURL = jest.fn();
});

function renderAs(role: CommunityRole, bio: string | null = 'Residents of Sunrise Tower') {
	const community: MyCommunity = { communityId: 'c1', username: 'sunrise', displayName: 'Sunrise', avatarUrl: null, role };
	render(<CommunityProfileCard community={community} bio={bio} />);
}

const editButton = () => screen.queryByRole('button', { name: en.profile.editProfile });
const nameField = () => screen.getByRole('textbox', { name: en.communities.nameLabel });
const bioField = () => screen.getByRole('textbox', { name: en.profile.bio });
const save = () => fireEvent.click(screen.getByRole('button', { name: en.profile.saveChanges }));

describe('CommunityProfileCard', () => {
	it('shows the account’s name, username and bio', () => {
		renderAs('EDITOR');
		expect(screen.getByText('Sunrise')).toBeInTheDocument();
		expect(screen.getByText('@sunrise')).toBeInTheDocument();
		expect(screen.getByText('Residents of Sunrise Tower')).toBeInTheDocument();
	});

	it.each(['OWNER', 'ADMIN'] as const)('offers Edit profile to an %s', (role) => {
		renderAs(role);
		expect(editButton()).toBeInTheDocument();
	});

	it.each(['CHIEF_EDITOR', 'EDITOR', 'ANALYST'] as const)('offers a %s no Edit profile', (role) => {
		renderAs(role);
		expect(editButton()).not.toBeInTheDocument();
	});

	it('has no username field', () => {
		renderAs('ADMIN');
		fireEvent.click(editButton()!);
		expect(screen.queryByRole('textbox', { name: en.account.usernameLabel })).not.toBeInTheDocument();
		expect(screen.getAllByRole('textbox')).toHaveLength(2);
	});

	it('refuses a blank name without saving', () => {
		renderAs('ADMIN');
		fireEvent.click(editButton()!);
		fireEvent.change(nameField(), { target: { value: '   ' } });
		save();
		expect(screen.getByText(en.communities.nameRequired)).toBeInTheDocument();
		expect(nameField()).toHaveAttribute('aria-invalid', 'true');
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it('saves only what changed, the name trimmed, and refreshes the page', async () => {
		renderAs('ADMIN');
		fireEvent.click(editButton()!);
		fireEvent.change(nameField(), { target: { value: '  Sunrise Committee ' } });
		save();
		await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith('c1', { displayName: 'Sunrise Committee' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(toast.success).toHaveBeenCalledWith(en.profile.updated);
		expect(mockRefresh).toHaveBeenCalled();
	});

	it('clears the bio with an empty one', async () => {
		renderAs('OWNER');
		fireEvent.click(editButton()!);
		fireEvent.change(bioField(), { target: { value: '' } });
		save();
		await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith('c1', { bio: '' }));
	});

	it('closes without a request when nothing changed', () => {
		renderAs('OWNER');
		fireEvent.click(editButton()!);
		save();
		expect(mockUpdate).not.toHaveBeenCalled();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('keeps the dialog open and says why when the API refuses', async () => {
		mockUpdate.mockResolvedValue({ ok: false, status: 403, errorCode: 'community.role_forbidden', message: 'x' });
		renderAs('ADMIN');
		fireEvent.click(editButton()!);
		fireEvent.change(nameField(), { target: { value: 'New' } });
		save();
		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('uploads a framed photo to the community’s avatar', async () => {
		renderAs('ADMIN');
		fireEvent.click(editButton()!);
		fireEvent.change(screen.getByTestId('community-avatar-file'), {
			target: { files: [new File(['x'], 'logo.png', { type: 'image/png' })] },
		});
		const use = await screen.findByRole('button', { name: en.avatar.crop.use });
		await waitFor(() => expect(use).toBeEnabled());
		fireEvent.click(use);
		await waitFor(() => expect(mockUpload).toHaveBeenCalledWith('c1', expect.any(FormData)));
		expect((mockUpload.mock.calls[0][1] as FormData).get('file')).toHaveProperty('type', 'image/jpeg');
		expect(mockRefresh).toHaveBeenCalled();
		expect(await screen.findByRole('textbox', { name: en.communities.nameLabel })).toBeInTheDocument();
	});
});
