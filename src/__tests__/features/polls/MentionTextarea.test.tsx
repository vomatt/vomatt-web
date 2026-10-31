import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import { MentionTextarea } from '@/features/polls/components/MentionTextarea';
import { activeMention, insertMention } from '@/features/polls/mention';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

const mockSearchUsers = jest.fn();
const mockGetFollowing = jest.fn();
jest.mock('@/lib/api/services/users', () => ({ searchUsers: (...a: unknown[]) => mockSearchUsers(...a) }));
jest.mock('@/features/follows/service', () => ({ getFollowing: (...a: unknown[]) => mockGetFollowing(...a) }));

const wanan = { id: 'u1', username: 'wanan_chiang', displayName: '蔣萬安', avatarUrl: null };
const percy = { id: 'u2', username: 'fi00123', displayName: 'Percy Jack', avatarUrl: null };

function Field({ guest = false }: { guest?: boolean }) {
	const [value, setValue] = useState('');
	return (
		<MentionTextarea
			aria-label="Comment"
			value={value}
			onValueChange={setValue}
			viewerUsername={guest ? undefined : 'klaus'}
		/>
	);
}

/** Types `value` with the caret at its end, then lets the debounced lookup answer. */
async function type(value: string) {
	const field = screen.getByLabelText('Comment') as HTMLTextAreaElement;
	fireEvent.change(field, { target: { value, selectionStart: value.length, selectionEnd: value.length } });
	await act(() => jest.runAllTimersAsync());
	return field;
}

beforeEach(() => {
	jest.useFakeTimers();
	mockSearchUsers.mockReset().mockResolvedValue({ items: [wanan, percy], nextCursor: null });
	mockGetFollowing.mockReset().mockResolvedValue({ ok: true, data: { items: [percy, wanan], nextCursor: null } });
});

afterEach(() => {
	jest.useRealTimers();
	jest.restoreAllMocks();
});

describe('activeMention()', () => {
	it('finds the handle the caret is in', () => {
		expect(activeMention('hi @Wan', 7)).toEqual({ start: 3, term: 'wan' });
	});

	it('finds a bare @', () => {
		expect(activeMention('@', 1)).toEqual({ start: 0, term: '' });
	});

	it('ignores an @ inside a word, like an email', () => {
		expect(activeMention('mail a@b', 8)).toBeNull();
	});

	it('ignores a handle the caret has left', () => {
		expect(activeMention('@wan done', 9)).toBeNull();
	});
});

describe('insertMention()', () => {
	it('replaces the whole handle, also past the caret, and adds one space', () => {
		expect(insertMention('hi @wa_x there', { start: 3, term: 'wa' }, 'wanan_chiang')).toEqual({
			text: 'hi @wanan_chiang there',
			caret: 17,
		});
	});
});

describe('MentionTextarea', () => {
	it('suggests the people the viewer follows on a bare @', async () => {
		render(<Field />);
		await type('@');
		expect(mockGetFollowing).toHaveBeenCalledWith('klaus');
		expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['fi00123Percy Jack', 'wanan_chiang蔣萬安']);
	});

	it('searches by what follows the @', async () => {
		render(<Field />);
		await type('Ask @Wan');
		expect(mockSearchUsers).toHaveBeenCalledWith('wan', undefined, expect.any(Number));
		expect(screen.getByRole('listbox', { name: 'People to mention' })).toBeInTheDocument();
	});

	it('mentions the clicked person', async () => {
		render(<Field />);
		const field = await type('Ask @wan');
		fireEvent.click(screen.getByRole('option', { name: /wanan_chiang/ }));
		expect(field).toHaveValue('Ask @wanan_chiang ');
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('moves with the arrow keys and mentions with Enter', async () => {
		render(<Field />);
		const field = await type('@wan');
		fireEvent.keyDown(field, { key: 'ArrowDown' });
		expect(screen.getByRole('option', { name: /fi00123/ })).toHaveAttribute('aria-selected', 'true');
		fireEvent.keyDown(field, { key: 'Enter' });
		expect(field).toHaveValue('@fi00123 ');
	});

	it('leaves Shift+Enter to the field for a new line', async () => {
		render(<Field />);
		const field = await type('@wan');
		fireEvent.keyDown(field, { key: 'Enter', shiftKey: true });
		expect(field).toHaveValue('@wan');
	});

	it('starts on the first row each time the list opens', async () => {
		render(<Field />);
		const field = await type('@');
		fireEvent.keyDown(field, { key: 'ArrowDown' });
		fireEvent.keyDown(field, { key: 'Enter' });
		await type('');
		await type('@');
		expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
	});

	it('closes on Escape without changing the text', async () => {
		render(<Field />);
		const field = await type('@wan');
		fireEvent.keyDown(field, { key: 'Escape' });
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		expect(field).toHaveValue('@wan');
	});

	it('suggests again for a new handle typed where a dismissed one was', async () => {
		render(<Field />);
		const field = await type('@wan');
		fireEvent.keyDown(field, { key: 'Escape' });
		await type('');
		await type('@fi');
		expect(screen.getByRole('listbox')).toBeInTheDocument();
	});

	it('says so when the lookup fails', async () => {
		mockSearchUsers.mockRejectedValue(new Error('rate limited'));
		jest.spyOn(console, 'error').mockImplementation(() => {});
		render(<Field />);
		const field = await type('@wan');
		expect(screen.getByRole('status')).toHaveTextContent('Couldn’t look up people.');
		expect(field).toHaveAttribute('aria-expanded', 'true');
	});

	it('leaves the viewer out of the suggestions', async () => {
		mockSearchUsers.mockResolvedValue({ items: [{ ...wanan, username: 'klaus' }, percy], nextCursor: null });
		render(<Field />);
		await type('@k');
		expect(screen.getAllByRole('option')).toHaveLength(1);
	});

	it('suggests no one to a guest', async () => {
		render(<Field guest />);
		await type('@wan');
		expect(mockSearchUsers).not.toHaveBeenCalled();
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: 'Comment' })).toBeInTheDocument();
	});
});
