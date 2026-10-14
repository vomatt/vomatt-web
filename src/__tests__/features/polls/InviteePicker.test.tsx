import { fireEvent, render, screen } from '@testing-library/react';

import { InviteePicker } from '@/features/polls/components/InviteePicker';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('@/lib/api/services/users', () => ({ searchUsers: jest.fn() }));
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
});
