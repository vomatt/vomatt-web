import { act, fireEvent, render, screen } from '@testing-library/react';

import { InviteePicker } from '@/features/polls/components/InviteePicker';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockSearchUsers = jest.fn();
jest.mock('@/lib/api/services/users', () => ({ searchUsers: (...a: unknown[]) => mockSearchUsers(...a) }));
jest.mock('@/features/groups/service', () => ({
	getGroups: () => Promise.resolve({ ok: false, message: 'down' }),
}));

describe('InviteePicker', () => {
	it('lets a picked Group without a pill (deleted, or Groups failed to load) be removed', async () => {
		const onChange = jest.fn();
		const value = { users: [], emails: [], groups: [{ id: 'g1', name: 'Book club', memberCount: 3 }] };
		render(<InviteePicker withGroups value={value} onChange={onChange} />);

		fireEvent.click(await screen.findByRole('button', { name: 'Remove Book club' }));
		expect(onChange).toHaveBeenCalledWith({ users: [], emails: [], groups: [] });
	});

	it("shows an official account in the results but won't invite it, and Enter skips it", async () => {
		jest.useFakeTimers();
		mockSearchUsers.mockResolvedValue({
			items: [
				{ id: 'o1', username: 'council', official: true },
				{ id: 'u1', username: 'counsel' },
			],
		});
		const onChange = jest.fn();
		render(<InviteePicker value={{ users: [], emails: [], groups: [] }} onChange={onChange} />);
		const input = screen.getByPlaceholderText('Username or email');
		fireEvent.change(input, { target: { value: 'coun' } });
		await act(async () => {
			await jest.runAllTimersAsync();
		});
		jest.useRealTimers();

		const official = screen.getByRole('button', { name: /council/ });
		expect(official).toBeDisabled();
		expect(official).toHaveAccessibleDescription('Official accounts don’t vote, so they can’t be invited.');
		fireEvent.click(official);
		expect(onChange).not.toHaveBeenCalled();

		fireEvent.keyDown(input, { key: 'Enter' });
		expect(onChange).toHaveBeenCalledWith({
			users: [{ id: 'u1', username: 'counsel', avatarUrl: undefined }],
			emails: [],
			groups: [],
		});
	});
});
