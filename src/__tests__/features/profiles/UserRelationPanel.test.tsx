import { fireEvent, render, screen } from '@testing-library/react';

import { UserRelationPanel } from '@/features/profiles/UserRelationPanel';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

const bob = { id: 'u1', username: 'bob', displayName: 'Bob', avatarUrl: 'bot:boba' };
const cy = { id: 'u2', username: 'cy', displayName: null, avatarUrl: null };

function renderEmbedded(load: jest.Mock) {
	return render(<UserRelationPanel ns="blocks" action="unblock" load={load} remove={jest.fn()} variant="embedded" />);
}

describe('UserRelationPanel embedded', () => {
	it('titles the row with the count and shows each person by handle only', async () => {
		const load = jest.fn().mockResolvedValue({ ok: true, data: { items: [bob, cy], nextCursor: null } });
		renderEmbedded(load);

		await screen.findByText('@bob');
		const heading = screen.getByRole('heading', { name: 'Blocked people' });
		expect(heading.nextElementSibling).toHaveTextContent('2');
		expect(screen.queryByText('Bob')).not.toBeInTheDocument();
		// No intro paragraph in the row
		expect(screen.queryByText(/They aren’t told/)).not.toBeInTheDocument();
	});

	it('leaves the count out until every page is in', async () => {
		const load = jest
			.fn()
			.mockResolvedValueOnce({ ok: true, data: { items: [bob], nextCursor: 'c2' } })
			.mockResolvedValueOnce({ ok: true, data: { items: [cy], nextCursor: null } });
		renderEmbedded(load);

		const heading = await screen.findByRole('heading', { name: 'Blocked people' });
		await screen.findByText('@bob');
		expect(heading.nextElementSibling).toBeNull();

		fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
		await screen.findByText('@cy');
		expect(heading.nextElementSibling).toHaveTextContent('2');
	});

	it('says so in one quiet line when nobody is blocked', async () => {
		const load = jest.fn().mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
		renderEmbedded(load);

		const empty = await screen.findByText('You haven’t blocked anyone.');
		expect(empty).not.toHaveClass('empty-state');
		expect(screen.getByRole('heading', { name: 'Blocked people' }).nextElementSibling).toBeNull();
	});

	it('offers a small Try again when loading fails', async () => {
		const load = jest
			.fn()
			.mockResolvedValueOnce({ ok: false, message: 'x' })
			.mockResolvedValueOnce({ ok: true, data: { items: [bob], nextCursor: null } });
		renderEmbedded(load);

		expect(await screen.findByText('Couldn’t load blocked people.')).toBeInTheDocument();
		const retry = screen.getByRole('button', { name: 'Try again' });
		expect(retry).toHaveClass('md:h-8');
		fireEvent.click(retry);
		expect(await screen.findByText('@bob')).toBeInTheDocument();
	});
});
