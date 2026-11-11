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

	it('leaves people already on the list out of the results', async () => {
		jest.useFakeTimers();
		mockSearchUsers.mockResolvedValue({
			items: [
				{ id: 'u1', username: 'ann' },
				{ id: 'u2', username: 'anna' },
			],
		});
		render(
			<InviteePicker value={{ users: [], emails: [], groups: [] }} onChange={jest.fn()} excludeUserIds={['u1']} />
		);
		fireEvent.change(screen.getByPlaceholderText('Username or email'), { target: { value: 'ann' } });
		await act(async () => {
			await jest.runAllTimersAsync();
		});
		jest.useRealTimers();

		expect(screen.queryByRole('button', { name: 'ann' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'anna' })).toBeInTheDocument();
	});

	it("shows a community account in the results but won't invite it, and Enter skips it", async () => {
		jest.useFakeTimers();
		mockSearchUsers.mockResolvedValue({
			items: [
				{ id: 'o1', username: 'council', community: true },
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

		const community = screen.getByRole('button', { name: /council/ });
		expect(community).toBeDisabled();
		expect(community).toHaveAccessibleDescription('Community accounts don’t vote, so they can’t be invited.');
		fireEvent.click(community);
		expect(onChange).not.toHaveBeenCalled();

		fireEvent.keyDown(input, { key: 'Enter' });
		expect(onChange).toHaveBeenCalledWith({
			users: [{ id: 'u1', username: 'counsel', avatarUrl: undefined }],
			emails: [],
			groups: [],
		});
	});
});
