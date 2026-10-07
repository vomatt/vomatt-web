import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';

import { CommentThread } from '@/features/polls/components/CommentThread';
import { useComments } from '@/features/polls/hooks/useComments';

jest.mock('next/link', () => {
	const Link = ({ children, href }: any) => <a href={href}>{children}</a>;
	return Link;
});
 
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));

const service = {
	getComments: jest.fn(),
	postComment: jest.fn(),
	updateComment: jest.fn(),
	deleteComment: jest.fn(),
	likeComment: jest.fn(),
	unlikeComment: jest.fn(),
};
jest.mock('@/features/polls/service', () => ({
	getComments: (...a: any[]) => service.getComments(...a),
	postComment: (...a: any[]) => service.postComment(...a),
	updateComment: (...a: any[]) => service.updateComment(...a),
	deleteComment: (...a: any[]) => service.deleteComment(...a),
	likeComment: (...a: any[]) => service.likeComment(...a),
	unlikeComment: (...a: any[]) => service.unlikeComment(...a),
}));

const mine = { id: 'c1', userId: 'me', author: 'klaus', text: 'Mine', createdAt: '2026-10-05T00:00:00Z', likeCount: 2 };
const theirs = { id: 'c2', userId: 'other', author: 'mei', text: 'Theirs', createdAt: '2026-10-04T00:00:00Z' };

beforeEach(() => {
	jest.clearAllMocks();
	service.getComments.mockResolvedValue({ ok: true, data: { items: [mine, theirs], nextCursor: null, total: 2 } });
});

function Harness() {
	const thread = useComments('poll-1', { enabled: true });
	return <CommentThread thread={thread} viewerId="me" requireAuth={(action) => action()} />;
}

describe('CommentThread', () => {
	it('offers edit and delete only on the viewer\'s own comments', async () => {
		render(<Harness />);
		await screen.findByText('Mine');
		expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1);
		expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1);
	});

	it('likes optimistically and rolls back on failure', async () => {
		service.likeComment.mockResolvedValue({ ok: false, message: 'nope' });
		render(<Harness />);
		await screen.findByText('Mine');
		const like = screen.getAllByRole('button', { name: 'Like' })[0];

		fireEvent.click(like);
		expect(like).toHaveAttribute('aria-pressed', 'true');
		expect(like).toHaveTextContent('3');

		await waitFor(() => expect(like).toHaveAttribute('aria-pressed', 'false'));
		expect(like).toHaveTextContent('2');
	});

	it('deletes after confirming', async () => {
		service.deleteComment.mockResolvedValue({ ok: true, data: undefined });
		render(<Harness />);
		await screen.findByText('Mine');

		fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
		fireEvent.click(within(screen.getByRole('group')).getByRole('button', { name: 'Delete' }));

		expect(service.deleteComment).toHaveBeenCalledWith('poll-1', 'c1');
		await waitFor(() => expect(screen.queryByText('Mine')).not.toBeInTheDocument());
	});
});

describe('useComments', () => {
	it('does not fetch until enabled', () => {
		renderHook(() => useComments('poll-1', { enabled: false }));
		expect(service.getComments).not.toHaveBeenCalled();
	});

	it('removes a comment that failed to post', async () => {
		service.postComment.mockResolvedValue({ ok: false, message: 'down' });
		const { result } = renderHook(() => useComments('poll-1', { enabled: true }));
		await waitFor(() => expect(result.current.status).toBe('ready'));

		await act(async () => {
			await result.current.add('Lost', 'You');
		});
		expect(result.current.comments.map((c) => c.text)).toEqual(['Mine', 'Theirs']);
		expect(result.current.total).toBe(2);
	});
});
