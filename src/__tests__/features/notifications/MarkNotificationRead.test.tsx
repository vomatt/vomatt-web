import { render } from '@testing-library/react';

import { ActingProvider } from '@/features/communities/ActingProvider';
import { MarkNotificationRead } from '@/features/notifications/MarkNotificationRead';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
const mockMarkRead = jest.fn();
jest.mock('@/features/notifications/service', () => ({ markNotificationRead: (...a: unknown[]) => mockMarkRead(...a) }));
jest.mock('@/features/notifications/UnreadCountProvider', () => ({
	useUnreadCount: () => ({ count: 2, isLoaded: true, refresh: jest.fn() }),
}));

const acting = (locked: boolean) => ({
	communityId: 'c1',
	username: 'robotics',
	displayName: 'Robotics Club',
	avatarUrl: null,
	role: 'OWNER' as const,
	locked,
});

const renderAs = (locked: boolean) =>
	render(
		<ActingProvider state={{ acting: acting(locked), me: null, communities: [], stale: false }}>
			<MarkNotificationRead pollId="p1" />
		</ActingProvider>
	);

beforeEach(() => {
	jest.clearAllMocks();
	mockMarkRead.mockResolvedValue(true);
});

it('reads the poll’s notification when something is unread', () => {
	renderAs(false);
	expect(mockMarkRead).toHaveBeenCalledWith('p1');
});

it('reads nothing while acting as a locked community account, which the API would refuse', () => {
	renderAs(true);
	expect(mockMarkRead).not.toHaveBeenCalled();
});
