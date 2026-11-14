import { render, waitFor } from '@testing-library/react';

import { PendingFollow } from '@/features/follows/FollowButton';
import { followUser } from '@/features/follows/service';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
let mockMe: { username: string } | null = null;
jest.mock('@/features/communities/ActingProvider', () => ({
	...jest.requireActual('@/features/communities/ActingProvider'),
	useActing: () => ({ acting: null, me: mockMe, communities: [], stale: false }),
}));

beforeEach(() => {
	jest.clearAllMocks();
	sessionStorage.clear();
	sessionStorage.setItem('vomatt:pending-follow', 'u7');
});

describe('PendingFollow', () => {
	it('follows the person tapped before signing in, once, and forgets them', async () => {
		mockMe = { username: 'viewer' };
		const { rerender } = render(<PendingFollow />);
		rerender(<PendingFollow />);

		await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
		expect(followUser).toHaveBeenCalledTimes(1);
		expect(followUser).toHaveBeenCalledWith('u7');
		expect(sessionStorage.getItem('vomatt:pending-follow')).toBeNull();
	});

	it('does nothing while signed out', () => {
		mockMe = null;
		render(<PendingFollow />);

		expect(followUser).not.toHaveBeenCalled();
		expect(sessionStorage.getItem('vomatt:pending-follow')).toBe('u7');
	});
});
