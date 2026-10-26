import { act, fireEvent, render, screen } from '@testing-library/react';

import { PollDiscussion } from '@/app/(frontend)/poll/[id]/PollDiscussion';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }) }));
jest.mock('sonner', () => ({ toast: Object.assign(jest.fn(), { error: jest.fn(), success: jest.fn() }) }));

const mockPostComment = jest.fn();
const mockGetComments = jest.fn();
jest.mock('@/features/blocks/service', () => ({ blockUser: jest.fn() }));
jest.mock('@/features/polls/service', () => ({
	postComment: (...args: any[]) => mockPostComment(...args),
	getComments: (...args: any[]) => mockGetComments(...args),
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
});
