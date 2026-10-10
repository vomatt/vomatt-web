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
	getReplies: jest.fn(),
	postComment: jest.fn(),
	updateComment: jest.fn(),
	deleteComment: jest.fn(),
	likeComment: jest.fn(),
	unlikeComment: jest.fn(),
};
jest.mock('@/features/polls/service', () => ({
	getComments: (...a: any[]) => service.getComments(...a),
	getReplies: (...a: any[]) => service.getReplies(...a),
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
	service.getComments.mockResolvedValue({ ok: true, data: { items: [mine, theirs], nextCursor: null } });
});

const reply = {
	id: 'r1',
	userId: 'other',
	author: 'mei',
	text: 'A reply',
	createdAt: '2026-10-05T01:00:00Z',
	parentId: 'c1',
};

function Harness() {
	const thread = useComments('poll-1', { enabled: true, initialTotal: 2 });
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

	it('loads replies on demand', async () => {
		service.getComments.mockResolvedValue({
			ok: true,
			data: { items: [{ ...mine, replyCount: 1 }], nextCursor: null },
		});
		service.getReplies.mockResolvedValue({ ok: true, data: { items: [reply], nextCursor: null } });
		render(<Harness />);

		fireEvent.click(await screen.findByRole('button', { name: 'View 1 reply' }));
		expect(await screen.findByText('A reply')).toBeInTheDocument();
		expect(service.getReplies).toHaveBeenCalledWith('poll-1', 'c1', undefined);
	});

	it('replies to a reply under the same top-level comment, addressed to its author', async () => {
		service.getComments.mockResolvedValue({
			ok: true,
			data: { items: [{ ...mine, replyCount: 1 }], nextCursor: null },
		});
		service.getReplies.mockResolvedValue({ ok: true, data: { items: [reply], nextCursor: null } });
		service.postComment.mockResolvedValue({ ok: true, data: { ...reply, id: 'r2', text: '@mei agreed' } });
		render(<Harness />);
		fireEvent.click(await screen.findByRole('button', { name: 'View 1 reply' }));
		await screen.findByText('A reply');

		fireEvent.click(screen.getAllByRole('button', { name: 'Reply' })[1]);
		const box = screen.getByRole('textbox', { name: 'Write a reply…' });
		expect(box).toHaveValue('@mei ');
		fireEvent.change(box, { target: { value: '@mei agreed' } });
		fireEvent.submit(box.closest('form')!);

		await waitFor(() => expect(service.postComment).toHaveBeenCalledWith('poll-1', '@mei agreed', 'c1'));
		expect(await screen.findByText('@mei agreed')).toBeInTheDocument();
	});

	it('shows a placeholder for a deleted comment that has replies', async () => {
		service.getComments.mockResolvedValue({
			ok: true,
			data: {
				items: [{ ...mine, id: 'c9', deleted: true, author: null, text: null, userId: null, replyCount: 2 }],
				nextCursor: null,
			},
		});
		render(<Harness />);
		expect(await screen.findByText('This comment was deleted.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'View 2 replies' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Like' })).not.toBeInTheDocument();
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
		expect(result.current.total).toBeUndefined();
	});

	it('keeps a deleted comment with replies as a placeholder, and drops it with its last reply', async () => {
		service.getComments.mockResolvedValue({
			ok: true,
			data: { items: [{ ...mine, replyCount: 1 }], nextCursor: null },
		});
		service.getReplies.mockResolvedValue({ ok: true, data: { items: [reply], nextCursor: null } });
		service.deleteComment.mockResolvedValue({ ok: true, data: undefined });
		const { result } = renderHook(() => useComments('poll-1', { enabled: true, initialTotal: 2 }));
		await waitFor(() => expect(result.current.status).toBe('ready'));
		await act(async () => {
			await result.current.loadReplies('c1');
		});

		await act(async () => {
			await result.current.remove(result.current.comments[0]);
		});
		expect(result.current.comments[0]).toMatchObject({ id: 'c1', deleted: true, text: null });

		await act(async () => {
			await result.current.remove(result.current.replies.c1.items[0]);
		});
		expect(result.current.comments).toEqual([]);
		expect(result.current.total).toBe(0);
	});

	it('files a reply under its top-level comment and counts it', async () => {
		service.postComment.mockResolvedValue({ ok: true, data: { ...reply, id: 'r2' } });
		const { result } = renderHook(() => useComments('poll-1', { enabled: true, initialTotal: 2 }));
		await waitFor(() => expect(result.current.status).toBe('ready'));

		await act(async () => {
			await result.current.add('A reply', 'You', 'c1');
		});
		expect(service.postComment).toHaveBeenCalledWith('poll-1', 'A reply', 'c1');
		expect(result.current.replies.c1.items.map((c) => c.id)).toEqual(['r2']);
		expect(result.current.comments[0].replyCount).toBe(1);
		expect(result.current.total).toBe(3);
	});
});
