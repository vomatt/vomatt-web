import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { UserRelationPanel } from '@/features/profiles/UserRelationPanel';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

const bob = { id: 'u1', username: 'bob', displayName: 'Bob', avatarUrl: 'bot:boba' };
const cy = { id: 'u2', username: 'cy', displayName: null, avatarUrl: null };

function renderPanel(load: jest.Mock, remove = jest.fn()) {
	return render(<UserRelationPanel ns="blocks" action="unblock" load={load} remove={remove} />);
}

describe('UserRelationPanel', () => {
	it('lists each person by the name they show, then their handle, leaving the title to the page', async () => {
		const load = jest.fn().mockResolvedValue({ ok: true, data: { items: [bob, cy], nextCursor: null } });
		renderPanel(load);

		const items = await screen.findAllByRole('listitem');
		expect(items.map((item) => item.textContent)).toEqual(['Bob @bobUnblock', '@cyUnblock']);
		expect(screen.queryByRole('heading')).not.toBeInTheDocument();
	});

	it('adds the next page with Load more', async () => {
		const load = jest
			.fn()
			.mockResolvedValueOnce({ ok: true, data: { items: [bob], nextCursor: 'c2' } })
			.mockResolvedValueOnce({ ok: true, data: { items: [cy], nextCursor: null } });
		renderPanel(load);

		await screen.findByText('@bob');
		fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
		await screen.findByText('@cy');
		expect(load).toHaveBeenLastCalledWith('c2');
		expect(screen.getByText('@bob')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
	});

	it('takes an unblocked person off the list', async () => {
		const load = jest.fn().mockResolvedValue({ ok: true, data: { items: [bob, cy], nextCursor: null } });
		const remove = jest.fn().mockResolvedValue({ ok: true });
		renderPanel(load, remove);

		await screen.findByText('@bob');
		fireEvent.click(screen.getByRole('button', { name: 'Unblock @bob' }));
		await waitFor(() => expect(screen.queryByText('@bob')).not.toBeInTheDocument());
		expect(remove).toHaveBeenCalledWith('u1');
		expect(toast.success).toHaveBeenCalledWith('Unblocked @bob');
		expect(screen.getByText('@cy')).toBeInTheDocument();
	});

	it('says so in an empty state when nobody is blocked', async () => {
		const load = jest.fn().mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
		renderPanel(load);

		expect(await screen.findByText('You haven’t blocked anyone.')).toHaveClass('empty-state');
		expect(screen.queryByRole('list')).not.toBeInTheDocument();
	});

	it('keeps Load more instead of the empty state when the people unblocked were only the first page', async () => {
		const load = jest.fn().mockResolvedValue({ ok: true, data: { items: [bob], nextCursor: 'c2' } });
		renderPanel(load, jest.fn().mockResolvedValue({ ok: true }));

		fireEvent.click(await screen.findByRole('button', { name: 'Unblock @bob' }));
		await waitFor(() => expect(screen.queryByText('@bob')).not.toBeInTheDocument());
		expect(screen.queryByText('You haven’t blocked anyone.')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument();
	});

	it('offers Try again when loading fails', async () => {
		const load = jest
			.fn()
			.mockResolvedValueOnce({ ok: false, message: 'x' })
			.mockResolvedValueOnce({ ok: true, data: { items: [bob], nextCursor: null } });
		renderPanel(load);

		expect(await screen.findByText('Couldn’t load blocked people.')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		expect(await screen.findByText('@bob')).toBeInTheDocument();
		expect(screen.queryByText('Couldn’t load blocked people.')).not.toBeInTheDocument();
	});
});
