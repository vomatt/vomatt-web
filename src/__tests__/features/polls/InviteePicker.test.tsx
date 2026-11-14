import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
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
		expect(screen.getByRole('button', { name: '@anna' })).toBeInTheDocument();
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

	it('lists every match on the first page of 20, not just the first few', async () => {
		jest.useFakeTimers();
		try {
			mockSearchUsers.mockResolvedValue({
				items: Array.from({ length: 20 }, (_, i) => ({ id: `u${i}`, username: `mate${i}` })),
			});
			render(<InviteePicker value={{ users: [], emails: [], groups: [] }} onChange={jest.fn()} />);
			fireEvent.change(screen.getByPlaceholderText('Username or email'), { target: { value: 'mate' } });
			await act(async () => {
				await jest.runAllTimersAsync();
			});
		} finally {
			jest.useRealTimers();
		}

		expect(mockSearchUsers).toHaveBeenLastCalledWith('mate');
		expect(within(screen.getByRole('list', { name: 'Matching people' })).getAllByRole('button')).toHaveLength(20);
	});

	it('keeps the field focused through a pick, so tapping it again on a phone leaves the dialog open', async () => {
		jest.useFakeTimers();
		mockSearchUsers.mockResolvedValue({ items: [{ id: 'u1', username: 'ann' }, { id: 'u2', username: 'anna' }] });
		const onOpenChange = jest.fn();
		function Harness() {
			const [value, setValue] = useState({ users: [], emails: [], groups: [] } as React.ComponentProps<typeof InviteePicker>['value']);
			return (
				<Dialog open onOpenChange={onOpenChange}>
					<DialogContent closeLabel="Close">
						<DialogTitle>Book club</DialogTitle>
						<InviteePicker value={value} onChange={setValue} />
					</DialogContent>
				</Dialog>
			);
		}
		render(<Harness />);
		const input = screen.getByPlaceholderText('Username or email');
		fireEvent.change(input, { target: { value: 'ann' } });
		await act(async () => {
			await jest.runAllTimersAsync();
		});
		jest.useRealTimers();

		const user = userEvent.setup();
		await user.click(input);
		// A pick that took focus would close the keyboard, and reopening it shifts the dialog mid-tap
		await user.click(screen.getByRole('button', { name: '@ann' }));
		expect(screen.getByRole('list', { name: 'Invited' })).toHaveTextContent('ann');
		expect(input).toHaveFocus();

		await user.click(input);
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});
});
