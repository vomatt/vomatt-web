import { render, screen } from '@testing-library/react';

import AccountPage from '@/app/(frontend)/[slug]/_components/AccountPage';
import type { MyProfile, UserProfile } from '@/types/user';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }) }));
jest.mock('@/lib/api/services/auth', () => ({ signout: jest.fn() }));
jest.mock('@/lib/api/services/users', () => ({
	deleteMyAccount: jest.fn(),
	updateVisibility: jest.fn(),
	editProfile: jest.fn(),
}));
jest.mock('@/features/polls/service', () => ({ getUserPolls: jest.fn() }));
jest.mock('@/hooks/useAvatarUpload', () => ({
	useAvatarUpload: () => ({ avatarUrl: null, isUploading: false, upload: jest.fn(), remove: jest.fn() }),
}));

const publicProfile: UserProfile = {
	username: 'mei',
	displayName: null,
	bio: null,
	joinedAt: '2026-08-01T10:00:00Z',
	totalPolls: 3,
	totalVotes: 12,
	location: 'Taipei',
	points: null,
	membershipLevel: null,
};

const myProfile: MyProfile = {
	id: 'u1',
	username: 'mei',
	email: 'mei@example.com',
	phoneNumber: null,
	firstName: null,
	lastName: null,
	displayName: 'Mei',
	bio: 'Poll enthusiast',
	location: 'Taipei',
	points: 120,
	membershipLevel: null,
	active: true,
	lastLoginAt: null,
	joinedAt: '2026-08-01T10:00:00Z',
	totalPolls: 3,
	totalVotes: 12,
	visibilitySettings: { points: true },
};

const insights = { peopleReached: 40, majorityRate: 50, awaitingResults: 0 };

describe('AccountPage', () => {
	it('shows a visitor the same header and stats, with only public fields', () => {
		render(
			<AccountPage
				isOwn={false}
				profile={publicProfile}
				polls={{ items: [], nextCursor: null }}
				isAuthenticated={false}
			/>
		);

		expect(screen.getByRole('heading', { level: 1, name: 'mei' })).toBeInTheDocument();
		expect(screen.getByText(/Taipei · Joined/)).toBeInTheDocument();
		expect(screen.queryByText(/points/)).not.toBeInTheDocument();
		expect(screen.getByText('Votes cast')).toBeInTheDocument();
		expect(screen.getByText('Polls created')).toBeInTheDocument();
	});

	it('hides owner-only stats, tabs and actions from visitors', () => {
		render(
			<AccountPage
				isOwn={false}
				profile={publicProfile}
				polls={{ items: [], nextCursor: null }}
				isAuthenticated
			/>
		);

		expect(screen.queryByText('People reached')).not.toBeInTheDocument();
		expect(screen.queryByRole('tab')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 2, name: 'Polls' })).toBeInTheDocument();
	});

	it('shows the owner every field, stat and tab', () => {
		render(<AccountPage isOwn profile={myProfile} myPolls={[]} history={[]} insights={insights} />);

		expect(screen.getByRole('heading', { level: 1, name: 'Mei' })).toBeInTheDocument();
		expect(screen.getByText(/120 points/)).toBeInTheDocument();
		// Location is hidden from visitors, so the owner's header leaves it out too
		expect(screen.queryByText(/Taipei/)).not.toBeInTheDocument();
		expect(screen.getByText('People reached')).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: 'Settings' })).toBeInTheDocument();
	});
});
