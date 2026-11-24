import PollDetailPage from '@/app/(frontend)/poll/[id]/page';
import { Refreshable } from '@/components/Refreshable';
import { toShortId } from '@/features/polls/shortId';

jest.mock('@/features/polls/service', () => ({ getPoll: jest.fn(), getInviteOnlyCreator: jest.fn(), getUserPolls: jest.fn() }));
jest.mock('@/lib/api/client', () => ({ AuthError: class AuthError extends Error {} }));
jest.mock('@/features/notifications/MarkNotificationRead', () => ({ MarkNotificationRead: () => null }));
jest.mock('@/data/auth', () => ({ getMyProfile: jest.fn(), getUserSession: jest.fn() }));
jest.mock('@/lib/api/services/auth', () => ({ signout: jest.fn() }));
jest.mock('@/app/(frontend)/poll/[id]/PollDiscussion', () => ({ PollDiscussion: () => null }));
jest.mock('@/features/polls/sharePreview', () => ({ shareDescription: () => 'description' }));

it('refetches turnout and comments when the poll page is pulled down', async () => {
	const page = await PollDetailPage({ params: Promise.resolve({ id: toShortId('01a195a4-2a06-7137-a746-2c2ebb8136cc') }) });
	expect(page.type).toBe(Refreshable);
});
