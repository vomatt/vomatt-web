import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';

import { CommentThread, useCommentLink } from '@/features/polls/components/CommentThread';
import { useComments } from '@/features/polls/hooks/useComments';

jest.mock('next/link', () => {
	const Link = ({ children, href }: any) => <a href={href}>{children}</a>;
	return Link;
});
 
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/features/blocks/service', () => ({ blockUser: jest.fn() }));

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
const theirs = {
	id: 'c2',
	userId: 'other',
	author: 'mei',
	authorAvatarUrl: 'bot:bear',
	text: 'Theirs',
	createdAt: '2026-10-04T00:00:00Z',
};

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
	const [open, setOpen] = useState(true);
	useCommentLink(thread);
	return (
		<>
			<button type="button" onClick={() => setOpen((value) => !value)}>
				Fold
			</button>
			{open && <CommentThread thread={thread} pollId="poll-1" viewerId="me" requireAuth={(action) => action()} />}
		</>
	);
}

/** Opens the "…" menu of the comment whose text this is and returns the menu. */
async function openMenu(text: string) {
	const article = screen.getByText(text).closest('article')!;
	fireEvent.click(within(article).getAllByRole('button', { name: 'More' })[0]);
	return screen.findByRole('menu');
}

describe('CommentThread', () => {
	it("shows each author's chosen avatar", async () => {
		render(<Harness />);
		const article = (await screen.findByText('Theirs')).closest('article')!;
		expect(article.querySelector('img')).toHaveAttribute('src', '/avatars/bear.svg');
	});

	it("offers edit and delete on the viewer's own comments, block on others'", async () => {
		render(<Harness />);
		await screen.findByText('Mine');

		let menu = await openMenu('Mine');
		expect(within(menu).getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
		expect(within(menu).getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
		expect(within(menu).queryByRole('menuitem', { name: 'Block' })).not.toBeInTheDocument();
		fireEvent.keyDown(menu, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

		menu = await openMenu('Theirs');
		expect(within(menu).queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
		expect(within(menu).getByRole('menuitem', { name: 'Block' })).toBeInTheDocument();
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

		fireEvent.click(within(await openMenu('Mine')).getByRole('menuitem', { name: 'Delete' }));
		const dialog = await screen.findByRole('alertdialog');
		expect(dialog).toHaveTextContent('This can’t be undone.');
		fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

		expect(service.deleteComment).toHaveBeenCalledWith('poll-1', 'c1');
		await waitFor(() => expect(screen.queryByText('Mine')).not.toBeInTheDocument());
	});

	it('moves focus to the discussion after deleting, so it is not lost', async () => {
		service.deleteComment.mockResolvedValue({ ok: true, data: undefined });
		render(<Harness />);
		await screen.findByText('Mine');

		fireEvent.click(within(await openMenu('Mine')).getByRole('menuitem', { name: 'Delete' }));
		fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }));

		await waitFor(() => expect(screen.getByRole('region', { name: 'Discussion' })).toHaveFocus());
	});

	it('returns focus to the menu button when the delete is cancelled', async () => {
		render(<Harness />);
		await screen.findByText('Mine');

		fireEvent.click(within(await openMenu('Mine')).getByRole('menuitem', { name: 'Delete' }));
		fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancel' }));

		const article = screen.getByText('Mine').closest('article')!;
		await waitFor(() => expect(within(article).getByRole('button', { name: 'More' })).toHaveFocus());
	});

	it('edits in place and returns focus to the menu button when editing is cancelled', async () => {
		render(<Harness />);
		await screen.findByText('Mine');

		fireEvent.click(within(await openMenu('Mine')).getByRole('menuitem', { name: 'Edit' }));
		expect(screen.getByRole('textbox', { name: 'Edit' })).toHaveValue('Mine');
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		const article = screen.getByText('Mine').closest('article')!;
		await waitFor(() => expect(within(article).getByRole('button', { name: 'More' })).toHaveFocus());
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
		expect(screen.getByText('Replying to')).toBeInTheDocument();
		const box = screen.getByRole('textbox', { name: 'Write a reply…' });
		fireEvent.change(box, { target: { value: 'agreed' } });
		fireEvent.submit(box.closest('form')!);

		await waitFor(() => expect(service.postComment).toHaveBeenCalledWith('poll-1', '@mei agreed', 'c1'));
		// The leading mention becomes an addressee chip that jumps to the reply it answers
		const posted = await screen.findByText('agreed');
		const chip = within(posted.closest('[id^=comment-]')!).getByRole('button', { name: 'Replying to mei' });
		const target = screen.getByText('A reply').closest('[id^=comment-]')!;
		target.scrollIntoView = jest.fn();
		target.animate = jest.fn();
		fireEvent.click(chip);
		expect(target.scrollIntoView).toHaveBeenCalled();
	});

	describe('a reply to a reply', () => {
		const answer = { ...reply, id: 'r2', userId: 'me', author: 'klaus', text: '@mei agreed' };

		beforeEach(() => {
			service.getComments.mockResolvedValue({
				ok: true,
				data: { items: [{ ...mine, replyCount: 2 }], nextCursor: null },
			});
			service.getReplies.mockResolvedValue({ ok: true, data: { items: [reply, answer], nextCursor: null } });
		});

		beforeEach(async () => {
			render(<Harness />);
			fireEvent.click(await screen.findByRole('button', { name: 'View 2 replies' }));
		});

		async function openReplyMenu(text: string) {
			const item = (await screen.findByText(text)).closest<HTMLElement>('[id^=comment-]')!;
			fireEvent.click(within(item).getByRole('button', { name: 'More' }));
			return screen.findByRole('menu');
		}

		it('edits the text without the mention and keeps it on save', async () => {
			service.updateComment.mockResolvedValue({ ok: true, data: { ...answer, text: '@mei fully agreed' } });
			fireEvent.click(within(await openReplyMenu('agreed')).getByRole('menuitem', { name: 'Edit' }));

			const box = screen.getByRole('textbox', { name: 'Edit' });
			expect(box).toHaveValue('agreed');
			fireEvent.change(box, { target: { value: 'fully agreed' } });
			fireEvent.click(screen.getByRole('button', { name: 'Save' }));

			await waitFor(() => expect(service.updateComment).toHaveBeenCalledWith('poll-1', 'r2', '@mei fully agreed'));
		});

		it('does not save an edit that leaves the text as it was', async () => {
			service.getReplies.mockResolvedValue({
				ok: true,
				data: { items: [reply, { ...answer, text: '@mei\nagreed' }], nextCursor: null },
			});
			fireEvent.click(within(await openReplyMenu('agreed')).getByRole('menuitem', { name: 'Edit' }));
			fireEvent.click(screen.getByRole('button', { name: 'Save' }));

			await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Edit' })).not.toBeInTheDocument());
			expect(service.updateComment).not.toHaveBeenCalled();
		});

		it('takes the mention from the edit limit', async () => {
			fireEvent.click(within(await openReplyMenu('agreed')).getByRole('menuitem', { name: 'Edit' }));
			expect(screen.getByRole('textbox', { name: 'Edit' })).toHaveAttribute('maxLength', String(2000 - '@mei '.length));
		});

		it('copies the text without the mention, and a link that names the reply under its comment', async () => {
			const writeText = jest.fn().mockResolvedValue(undefined);
			Object.assign(navigator, { clipboard: { writeText } });
			try {
				fireEvent.click(within(await openReplyMenu('agreed')).getByRole('menuitem', { name: 'Copy text' }));
				await waitFor(() => expect(writeText).toHaveBeenCalledWith('agreed'));
				await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

				fireEvent.click(within(await openReplyMenu('A reply')).getByRole('menuitem', { name: 'Copy link' }));
				await waitFor(() => expect(writeText).toHaveBeenCalledWith('http://localhost/poll/poll-1#comment-c1/r1'));
			} finally {
				delete (navigator as { clipboard?: unknown }).clipboard;
			}
		});

		it('counts the mention toward the length of a reply to a reply', async () => {
			await screen.findByText('A reply');
			fireEvent.click(screen.getAllByRole('button', { name: 'Reply' })[1]);
			const box = screen.getByRole('textbox', { name: 'Write a reply…' });
			fireEvent.change(box, { target: { value: 'x'.repeat(2000 - '@mei '.length + 1) } });

			expect(screen.getByText(`${2000 - '@mei '.length + 1} / ${2000 - '@mei '.length}`)).toBeInTheDocument();
			expect(within(box.closest('form')!).getByRole('button', { name: 'Reply' })).toBeDisabled();
		});
	});

	it('keeps a leading mention as text when no earlier reply is by that author', async () => {
		service.getComments.mockResolvedValue({
			ok: true,
			data: { items: [{ ...mine, replyCount: 1 }], nextCursor: null },
		});
		service.getReplies.mockResolvedValue({ ok: true, data: { items: [{ ...reply, text: '@everyone read this' }], nextCursor: null } });
		render(<Harness />);
		fireEvent.click(await screen.findByRole('button', { name: 'View 1 reply' }));

		expect(await screen.findByText('@everyone read this')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'everyone' })).not.toBeInTheDocument();
	});

	it('shows the reply a copied link names once its comment and replies have loaded', async () => {
		service.getComments.mockResolvedValue({
			ok: true,
			data: { items: [{ ...mine, replyCount: 1 }], nextCursor: null },
		});
		service.getReplies.mockResolvedValue({ ok: true, data: { items: [reply], nextCursor: null } });
		const scrollIntoView = jest.fn(function (this: Element) {
			return this.id;
		});
		const { scrollIntoView: realScroll, animate: realAnimate } = Element.prototype;
		Element.prototype.scrollIntoView = scrollIntoView;
		Element.prototype.animate = jest.fn();
		window.location.hash = '#comment-c1/r1';
		try {
			render(<Harness />);
			await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
			expect(service.getReplies).toHaveBeenCalledWith('poll-1', 'c1', undefined);
			expect(scrollIntoView.mock.contexts[0]).toHaveAttribute('id', 'comment-r1');

			// Folding and reopening the discussion doesn't jump back to it
			fireEvent.click(screen.getByRole('button', { name: 'Fold' }));
			fireEvent.click(screen.getByRole('button', { name: 'Fold' }));
			await screen.findByText('A reply');
			expect(scrollIntoView).toHaveBeenCalledTimes(1);
		} finally {
			window.location.hash = '';
			Element.prototype.scrollIntoView = realScroll;
			Element.prototype.animate = realAnimate;
		}
	});

	it('drops a blocked user’s comments from the list', async () => {
		const { blockUser } = jest.requireMock('@/features/blocks/service');
		blockUser.mockResolvedValue({ ok: true, data: undefined });
		render(<Harness />);
		await screen.findByText('Theirs');

		fireEvent.click(within(await openMenu('Theirs')).getByRole('menuitem', { name: 'Block' }));
		fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Block' }));

		await waitFor(() => expect(screen.queryByText('Theirs')).not.toBeInTheDocument());
		expect(blockUser).toHaveBeenCalledWith('other');
		expect(service.getComments).toHaveBeenCalledTimes(1);
	});

	it('offers no Block for a comment without its author id', async () => {
		service.getComments.mockResolvedValue({
			ok: true,
			data: { items: [mine, { ...theirs, userId: null }], nextCursor: null },
		});
		render(<Harness />);
		await screen.findByText('Theirs');

		const menu = await openMenu('Theirs');
		expect(within(menu).queryByRole('menuitem', { name: 'Block' })).not.toBeInTheDocument();
	});

	it('lists a new reply after the older ones it loads first', async () => {
		service.getComments.mockResolvedValue({
			ok: true,
			data: { items: [{ ...mine, replyCount: 1 }], nextCursor: null },
		});
		service.getReplies.mockResolvedValue({ ok: true, data: { items: [reply], nextCursor: null } });
		service.postComment.mockResolvedValue({ ok: true, data: { ...reply, id: 'r2', text: 'Newest' } });
		render(<Harness />);

		fireEvent.click((await screen.findAllByRole('button', { name: 'Reply' }))[0]);
		const box = screen.getByRole('textbox', { name: 'Write a reply…' });
		fireEvent.change(box, { target: { value: 'Newest' } });
		fireEvent.submit(box.closest('form')!);

		const newest = await screen.findByText('Newest');
		const older = screen.getByText('A reply');
		expect(older.compareDocumentPosition(newest) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

	it('retries a reply page that failed to load', async () => {
		service.getReplies
			.mockResolvedValueOnce({ ok: false, message: 'down' })
			.mockResolvedValueOnce({ ok: true, data: { items: [reply], nextCursor: null } });
		const { result } = renderHook(() => useComments('poll-1', { enabled: true }));
		await waitFor(() => expect(result.current.status).toBe('ready'));

		await act(async () => {
			await result.current.loadReplies('c1');
		});
		expect(result.current.replies.c1.status).toBe('error');

		await act(async () => {
			await result.current.loadReplies('c1');
		});
		expect(result.current.replies.c1).toMatchObject({ status: 'ready', items: [reply] });
	});

	it('drops a blocked author’s threads and replies, and stops counting those replies', async () => {
		service.getComments.mockResolvedValue({
			ok: true,
			data: {
				items: [
					{ ...mine, replyCount: 2 },
					theirs,
					{ ...mine, id: 'c3', deleted: true, author: null, text: null, userId: null, replyCount: 1 },
				],
				nextCursor: null,
			},
		});
		service.getReplies.mockImplementation((_poll: string, rootId: string) =>
			Promise.resolve({
				ok: true,
				data: {
					items:
						rootId === 'c1'
							? [reply, { ...reply, id: 'r2', userId: 'me', author: 'klaus' }]
							: [{ ...reply, id: 'r3', parentId: 'c3' }],
					nextCursor: null,
				},
			})
		);
		const { result } = renderHook(() => useComments('poll-1', { enabled: true }));
		await waitFor(() => expect(result.current.status).toBe('ready'));
		await act(async () => {
			await result.current.loadReplies('c1');
		});
		await act(async () => {
			await result.current.loadReplies('c3');
		});

		act(() => result.current.dropAuthor('mei'));
		expect(result.current.comments.map((c) => c.id)).toEqual(['c1']);
		expect(result.current.comments[0].replyCount).toBe(1);
		expect(result.current.replies.c1.items.map((c) => c.id)).toEqual(['r2']);
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
