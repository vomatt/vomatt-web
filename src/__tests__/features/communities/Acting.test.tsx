import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { SidebarProvider } from '@/components/ui/Sidebar';
import type { ActingState } from '@/data/auth';
import { AccountSwitcher } from '@/features/communities/AccountSwitcher';
import { actAsCommunity, loadMyCommunities } from '@/features/communities/acting';
import { ActingBanner } from '@/features/communities/ActingBanner';
import { ActingProvider } from '@/features/communities/ActingProvider';
import { CommunityAccountsCard } from '@/features/communities/CommunityAccountsCard';
import type { CommunityRole, MyCommunity } from '@/features/communities/schema';
import { type Follow, FollowButton } from '@/features/follows/FollowButton';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn(), info: jest.fn() } }));
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }), usePathname: () => '/' }));
jest.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

const community = (communityId: string, role: CommunityRole): MyCommunity => ({
	communityId,
	username: communityId,
	displayName: `Community ${communityId}`,
	avatarUrl: null,
	role,
});
const me = { username: 'klaus', displayName: 'Klaus', avatarUrl: null };
const renderWith = (state: Partial<ActingState>, ui: React.ReactNode) =>
	render(<ActingProvider state={{ acting: null, me, communities: [], stale: false, ...state }}>{ui}</ActingProvider>);

beforeEach(() => jest.clearAllMocks());

describe('AccountSwitcher', () => {
	it('stays hidden for someone in no community account', () => {
		renderWith({}, <SidebarProvider><AccountSwitcher /></SidebarProvider>);
		expect(screen.queryByRole('button', { name: 'Switch account' })).not.toBeInTheDocument();
	});

	it('offers every account the user can act as, and switches to the one picked', async () => {
		renderWith({ communities: [community('c1', 'EDITOR'), community('c2', 'ANALYST')] }, <SidebarProvider><AccountSwitcher /></SidebarProvider>);
		fireEvent.click(screen.getByRole('button', { name: 'Switch account' }));

		expect(await screen.findByRole('menuitemradio', { name: /Community c1/ })).toBeInTheDocument();
		// Analysts have nothing to do as the account until reports are in the app
		expect(screen.queryByRole('menuitemradio', { name: /Community c2/ })).not.toBeInTheDocument();

		expect(screen.getByRole('menuitemradio', { name: /Klaus/ })).toHaveAttribute('aria-checked', 'true');
		expect(screen.getByRole('menuitemradio', { name: /Community c1/ })).toHaveAttribute('aria-checked', 'false');

		fireEvent.click(screen.getByRole('menuitemradio', { name: /Community c1/ }));
		await waitFor(() => expect(actAsCommunity).toHaveBeenCalledWith('c1'));
		expect(toast.success).toHaveBeenCalledWith('You’re acting as Community c1');
		expect(mockRefresh).toHaveBeenCalled();
	});
});

describe('AccountSwitcher, community list', () => {
	it('loads the accounts in the background when the layout left them out', async () => {
		(loadMyCommunities as jest.Mock).mockResolvedValueOnce({ ok: true, data: [community('c1', 'OWNER')] });
		renderWith({ communities: null }, <SidebarProvider><AccountSwitcher /></SidebarProvider>);

		expect(await screen.findByRole('button', { name: 'Switch account' })).toBeInTheDocument();
	});

	it('still offers the way back when the person behind the account did not load', async () => {
		const acting = community('c1', 'OWNER');
		renderWith({ acting, me: null, communities: [acting] }, <SidebarProvider><AccountSwitcher /></SidebarProvider>);
		fireEvent.click(screen.getByRole('button', { name: 'Switch account' }));

		fireEvent.click(await screen.findByRole('menuitemradio', { name: 'You' }));
		await waitFor(() => expect(actAsCommunity).toHaveBeenCalledWith(null));
	});
});

describe('switching from two places at once', () => {
	it('runs one switch at a time', async () => {
		let finish: (value: unknown) => void = () => {};
		(actAsCommunity as jest.Mock).mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
		const acting = community('c1', 'OWNER');
		renderWith({ acting, communities: [acting] }, <><ActingBanner /><CommunityAccountsCard communities={[community('c2', 'ADMIN')]} /></>);

		fireEvent.click(screen.getByRole('button', { name: 'Switch back to you' }));
		fireEvent.click(screen.getByRole('button', { name: 'Act as Community c2' }));
		finish({ ok: true, data: undefined });
		await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
		expect(actAsCommunity).toHaveBeenCalledTimes(1);
	});
});

describe('ActingBanner', () => {
	it('says who the user is acting as, and switches back', async () => {
		const acting = community('c1', 'OWNER');
		renderWith({ acting, communities: [acting] }, <ActingBanner />);

		expect(screen.getByRole('status')).toHaveTextContent('You’re acting as Community c1.');
		fireEvent.click(screen.getByRole('button', { name: 'Switch back to you' }));
		await waitFor(() => expect(actAsCommunity).toHaveBeenCalledWith(null));
	});

	it('is absent while the user acts as themself', () => {
		renderWith({}, <ActingBanner />);
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});
});

describe('ActingProvider', () => {
	it('goes back to the user when the cookie names an account they left', async () => {
		renderWith({ stale: true }, null);
		await waitFor(() => expect(actAsCommunity).toHaveBeenCalledWith(null));
		expect(mockRefresh).toHaveBeenCalled();
		expect(toast.info).toHaveBeenCalledWith('You can no longer act as that account, so you’re acting as yourself again.', {
			id: 'acting-ended',
		});
	});
});

describe('FollowButton while acting', () => {
	const follow = { state: 'follow', toggle: jest.fn(), isPending: false, confirming: false, setConfirming: jest.fn(), delta: 0 } as Follow;

	it('offers Follow to the user themself', () => {
		renderWith({}, <FollowButton follow={follow} username="ann" />);
		expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument();
	});

	it('is gone while acting as a community account, which doesn’t follow', () => {
		renderWith({ acting: { ...community('c1', 'OWNER') } }, <FollowButton follow={follow} username="ann" />);
		expect(screen.queryByRole('button', { name: 'Follow' })).not.toBeInTheDocument();
	});
});

describe('CommunityAccountsCard', () => {
	it('lets a member act as the account from Settings, but not an analyst', async () => {
		renderWith({}, <CommunityAccountsCard communities={[community('c1', 'ADMIN'), community('c2', 'ANALYST')]} />);

		expect(screen.queryByRole('button', { name: 'Act as Community c2' })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Act as Community c1' }));
		await waitFor(() => expect(actAsCommunity).toHaveBeenCalledWith('c1'));
	});

	it('says so when switching fails', async () => {
		(actAsCommunity as jest.Mock).mockResolvedValueOnce({ ok: false, message: 'down' });
		renderWith({}, <CommunityAccountsCard communities={[community('c1', 'ADMIN')]} />);

		fireEvent.click(screen.getByRole('button', { name: 'Act as Community c1' }));
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Couldn’t switch accounts. Please try again.'));
	});
});
