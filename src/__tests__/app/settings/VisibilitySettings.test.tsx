import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';

import { VisibilitySettings } from '@/app/(frontend)/settings/visibility/_components/VisibilitySettings';
import VisibilityPage from '@/app/(frontend)/settings/visibility/page';
import { ActingProvider } from '@/features/communities/ActingProvider';
import type { MyProfile } from '@/types/user';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
const mockUpdateVisibility = jest.fn();
jest.mock('@/lib/api/services/users', () => ({
	updateVisibility: (...args: unknown[]) => mockUpdateVisibility(...args),
}));
const mockGetMyProfile = jest.fn();
const mockRedirectToLogin = jest.fn();
const mockLoadActingState = jest.fn();
jest.mock('@/data/auth', () => ({
	getMyProfile: () => mockGetMyProfile(),
	loadActingState: () => mockLoadActingState(),
	redirectToLogin: (path: string) => mockRedirectToLogin(path),
}));
jest.mock('@/lib/getServerLocale', () => ({ getServerMessages: jest.fn() }));
beforeEach(() => mockLoadActingState.mockResolvedValue({ acting: null }));

const profile: MyProfile = {
	id: 'u1',
	username: 'mei',
	email: 'mei@example.com',
	phoneNumber: null,
	firstName: 'Mei',
	lastName: 'Lin',
	birthday: '1990-01-01',
	displayName: 'Meimei',
	bio: 'Poll enthusiast',
	location: null,
	active: true,
	lastLoginAt: null,
	joinedAt: '2026-08-01T10:00:00Z',
	totalPolls: 3,
	totalVotes: 12,
	createdPollCount: 3,
	votedPollCount: 12,
	followersCount: 0,
	followingCount: 0,
	visibilitySettings: {},
	avatarUrl: 'bot:boba',
	anonymousBallotByDefault: false,
};

const preview = () => screen.getByRole('region', { name: 'What everyone sees' });

describe('VisibilitySettings', () => {
	beforeEach(() => {
		mockUpdateVisibility.mockReset();
	});

	it('shows a switch per setting with what it shows, the real name hidden and the rest public by default', () => {
		render(<VisibilitySettings profile={profile} />);

		expect(screen.getAllByRole('switch')).toHaveLength(4);
		expect(screen.getByRole('switch', { name: 'Gender' })).not.toBeChecked();
		expect(screen.getByRole('switch', { name: 'Gender' })).toHaveAccessibleDescription('Not set');
		expect(screen.getByRole('switch', { name: 'Real name' })).not.toBeChecked();
		expect(screen.getByRole('switch', { name: 'Real name' })).toHaveAccessibleDescription('Mei Lin');
		expect(screen.getByRole('switch', { name: 'Display name' })).toBeChecked();
		expect(screen.getByRole('switch', { name: 'Bio' })).toBeChecked();
		expect(screen.getByRole('switch', { name: 'Bio' })).toHaveAccessibleDescription('Poll enthusiast');
	});

	it('follows the saved settings, and says when a detail is not set', () => {
		render(
			<VisibilitySettings
				profile={{ ...profile, bio: null, visibilitySettings: { firstName: false, lastName: true, displayName: false } }}
			/>
		);
		// The real name shows when either half does
		expect(screen.getByRole('switch', { name: 'Real name' })).toBeChecked();
		expect(screen.getByRole('switch', { name: 'Display name' })).not.toBeChecked();
		expect(screen.getByRole('switch', { name: 'Bio' })).toHaveAccessibleDescription('Not set');
	});

	it('writes a Chinese real name family name first, as the preview does', () => {
		render(<VisibilitySettings profile={{ ...profile, firstName: '小明', lastName: '陳' }} />);
		expect(screen.getByRole('switch', { name: 'Real name' })).toHaveAccessibleDescription('陳小明');
	});

	it('saves both halves of the real name at once and says so', async () => {
		mockUpdateVisibility.mockResolvedValue({ firstName: true, lastName: true });
		render(<VisibilitySettings profile={profile} />);

		const realName = screen.getByRole('switch', { name: 'Real name' });
		fireEvent.click(realName);
		expect(realName).toBeChecked();
		expect(mockUpdateVisibility).toHaveBeenCalledWith({ firstName: true, lastName: true });
		await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Real name shown to everyone'));
		expect(realName).toBeEnabled();
		// So Back to this page or Settings doesn't bring the old settings back
		expect(mockRefresh).toHaveBeenCalled();
	});

	it('holds a switch while its save is in flight', async () => {
		let answer: (value: unknown) => void = () => {};
		mockUpdateVisibility.mockImplementation(() => new Promise((resolve) => (answer = resolve)));
		render(<VisibilitySettings profile={profile} />);

		const bio = screen.getByRole('switch', { name: 'Bio' });
		fireEvent.click(bio);
		expect(bio).toHaveAttribute('aria-disabled', 'true');
		expect(screen.getByRole('switch', { name: 'Display name' })).not.toHaveAttribute('aria-disabled', 'true');
		await act(async () => answer({}));
		expect(bio).not.toHaveAttribute('aria-disabled', 'true');
	});

	it('puts the switch back and says so when the save fails', async () => {
		mockUpdateVisibility.mockRejectedValue(new Error('x'));
		render(<VisibilitySettings profile={profile} />);

		const displayName = screen.getByRole('switch', { name: 'Display name' });
		fireEvent.click(displayName);
		expect(displayName).not.toBeChecked();
		await waitFor(() => expect(displayName).toBeChecked());
		expect(toast.error).toHaveBeenCalledWith('Couldn’t save. Try again.', { duration: Infinity });
	});

	it('drops a hidden detail from the preview of what everyone sees', async () => {
		mockUpdateVisibility.mockResolvedValue({ bio: false });
		render(<VisibilitySettings profile={profile} />);
		expect(within(preview()).getByText('Poll enthusiast')).toBeInTheDocument();

		fireEvent.click(screen.getByRole('switch', { name: 'Bio' }));
		expect(within(preview()).queryByText('Poll enthusiast')).not.toBeInTheDocument();
	});

	it('names a set gender in words and adds it to the preview once shown', async () => {
		mockUpdateVisibility.mockResolvedValue({ gender: true });
		render(<VisibilitySettings profile={{ ...profile, gender: 'FEMALE' }} />);
		const gender = screen.getByRole('switch', { name: 'Gender' });
		expect(gender).toHaveAccessibleDescription('Female');
		expect(within(preview()).queryByText(/Gender/)).not.toBeInTheDocument();

		fireEvent.click(gender);
		expect(mockUpdateVisibility).toHaveBeenCalledWith({ gender: true });
		expect(within(preview()).getByText(/Gender: Female/)).toBeInTheDocument();
		await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Gender shown to everyone'));
	});

	it('links to Edit profile to change the details themselves', () => {
		render(<VisibilitySettings profile={profile} />);
		expect(screen.getByRole('link', { name: 'Edit these details' })).toHaveAttribute('href', '/mei?edit=1');
	});
});

describe('What others see page', () => {
	it('is titled What others see and leads back to Settings', async () => {
		mockGetMyProfile.mockResolvedValue(profile);
		render(await VisibilityPage());
		expect(screen.getByRole('heading', { level: 1, name: 'What others see' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Back to Settings' })).toHaveAttribute('href', '/settings');
	});

	it('says these settings are the person’s own while acting as a community', async () => {
		mockGetMyProfile.mockResolvedValue(profile);
		const club = { communityId: 'c1', username: 'club', displayName: 'Robotics Club', avatarUrl: null, role: 'EDITOR' as const };
		mockLoadActingState.mockResolvedValue({ acting: club });
		render(
			<ActingProvider state={{ acting: club, me: null, communities: [club], stale: false }}>
				{await VisibilityPage()}
			</ActingProvider>
		);
		expect(screen.getByText('These settings are your own')).toBeInTheDocument();
		expect(screen.queryByRole('switch')).not.toBeInTheDocument();
	});

	it('sends a signed-out visitor to log in and back', async () => {
		mockGetMyProfile.mockResolvedValue(null);
		await VisibilityPage();
		expect(mockRedirectToLogin).toHaveBeenCalledWith('/settings/visibility');
	});
});
