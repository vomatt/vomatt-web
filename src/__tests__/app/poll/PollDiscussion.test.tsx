import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { PollDiscussion } from '@/app/(frontend)/poll/[id]/PollDiscussion';
import type { Poll } from '@/features/polls/schema';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace, refresh: jest.fn() }) }));
jest.mock('sonner', () => ({ toast: Object.assign(jest.fn(), { error: jest.fn(), success: jest.fn() }) }));

const mockPostComment = jest.fn();
const mockGetComments = jest.fn();
const mockDeletePoll = jest.fn();
jest.mock('@/features/blocks/service', () => ({ blockUser: jest.fn() }));
jest.mock('@/lib/api/services/users', () => ({ searchUsers: jest.fn() }));
jest.mock('@/features/follows/service', () => ({ getFollowing: jest.fn() }));
jest.mock('@/features/polls/service', () => ({
	postComment: (...args: any[]) => mockPostComment(...args),
	getComments: (...args: any[]) => mockGetComments(...args),
	deletePoll: (...args: any[]) => mockDeletePoll(...args),
}));

jest.mock('@/components/auth/AuthDialog', () => ({
	AuthDialog: ({ open, onAuthSuccess }: any) => {
		if (!open) return null;
		return (
			<div data-testid="auth-dialog">
				<button onClick={onAuthSuccess}>Mock Auth Success</button>
			</div>
		);
	},
}));

describe('PollDiscussion', () => {
	beforeEach(() => jest.clearAllMocks());

	it('opens sign-in on posting a comment, then posts it', async () => {
		mockGetComments.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
		mockPostComment.mockResolvedValue({
			ok: true,
			data: { id: 'c1', author: 'voter', text: 'Hello', createdAt: '2026-10-05T00:00:00Z' },
		});
		render(<PollDiscussion pollId="poll-1" commentCount={0} />);
		fireEvent.change(await screen.findByPlaceholderText('Why did you vote the way you did?'), {
			target: { value: 'Hello' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Post' }));

		expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
		await act(async () => {
			fireEvent.click(screen.getByText('Mock Auth Success'));
		});
		expect(mockPostComment).toHaveBeenCalledWith('poll-1', 'Hello', undefined);
		expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument();
		expect(await screen.findByText('Hello')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Discussion' }).nextSibling).toHaveTextContent('1');
	});

	it('shows comments to a guest without asking to sign in', async () => {
		mockGetComments.mockResolvedValue({
			ok: true,
			data: {
				items: [{ id: 'c1', author: 'mei', text: 'Saturday works', createdAt: '2026-10-05T00:00:00Z' }],
				nextCursor: null,
			},
		});
		render(<PollDiscussion pollId="poll-1" commentCount={1} />);

		expect(await screen.findByText('Saturday works')).toBeInTheDocument();
		expect(screen.queryByTestId('auth-dialog')).not.toBeInTheDocument();
	});

	it('keeps the comment text when the guest backs out of sign-in', async () => {
		mockGetComments.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
		render(<PollDiscussion pollId="poll-1" commentCount={1} />);
		const box = await screen.findByPlaceholderText('Why did you vote the way you did?');
		fireEvent.change(box, { target: { value: 'Draft' } });
		fireEvent.click(screen.getByRole('button', { name: 'Post' }));

		expect(mockPostComment).not.toHaveBeenCalled();
		expect(box).toHaveValue('Draft');
	});
	it('sends the owner to their profile after deleting the poll', async () => {
		mockGetComments.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
		mockDeletePoll.mockResolvedValue({ ok: true });
		const hour = 60 * 60 * 1000;
		const poll: Poll = {
			id: 'poll-1',
			title: 'Which day?',
			active: true,
			votingActive: false,
			creatorId: 'user-1',
			creatorUsername: 'mei.lin',
			createdAt: new Date(Date.now() - hour).toISOString(),
			startTime: new Date(Date.now() + 48 * hour).toISOString(),
			endTime: new Date(Date.now() + 72 * hour).toISOString(),
			participantCount: 0,
			myOptionId: null,
			voterVisibility: 'owner',
			options: [
				{ id: 'opt-fri', text: 'Friday' },
				{ id: 'opt-sat', text: 'Saturday' },
			],
		};
		render(<PollDiscussion pollId="poll-1" poll={poll} viewerId="user-1" viewer={{ username: 'mei_lin', avatarUrl: null }} />);
		fireEvent.click(screen.getByRole('button', { name: 'Delete poll' }));
		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete poll' }));

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/mei_lin'));
	});
});
