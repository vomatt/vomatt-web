import { render, waitFor } from '@testing-library/react';

import { ActingProvider } from '@/features/communities/ActingProvider';
import { MarkNotificationRead } from '@/features/notifications/MarkNotificationRead';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
const mockMarkRead = jest.fn();
jest.mock('@/features/notifications/service', () => ({ markNotificationRead: (...a: unknown[]) => mockMarkRead(...a) }));
const mockRefresh = jest.fn();
const mockSet = jest.fn();
jest.mock('@/features/notifications/UnreadCountProvider', () => ({
	useUnreadCount: () => ({ count: 2, isLoaded: true, refresh: mockRefresh, set: mockSet }),
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
	mockMarkRead.mockResolvedValue(1);
});

it('reads the poll’s notification when something is unread', () => {
	renderAs(false);
	expect(mockMarkRead).toHaveBeenCalledWith('p1');
});

it('shows the count the read returned, without asking again', async () => {
	renderAs(false);
	await waitFor(() => expect(mockSet).toHaveBeenCalledWith(1));
	expect(mockRefresh).not.toHaveBeenCalled();
});

it('asks for the count again when the read could not say it', async () => {
	mockMarkRead.mockResolvedValue(null);
	renderAs(false);
	await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
});

it('reads nothing while acting as a locked community account, which the API would refuse', () => {
	renderAs(true);
	expect(mockMarkRead).not.toHaveBeenCalled();
});
