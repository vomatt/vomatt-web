import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { CreateCommunityDialog } from '@/features/communities/CreateCommunityDialog';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockCreate = jest.fn();
jest.mock('@/features/communities/service', () => ({
	createCommunity: (...args: unknown[]) => mockCreate(...args),
}));

const onCreated = jest.fn();

function open() {
	render(<CreateCommunityDialog open onOpenChange={jest.fn()} onCreated={onCreated} />);
}

function fill(name: string, username: string) {
	fireEvent.change(screen.getByLabelText('Group name'), { target: { value: name } });
	fireEvent.change(screen.getByLabelText('Username'), { target: { value: username } });
	fireEvent.click(screen.getByRole('button', { name: 'Create' }));
}

describe('CreateCommunityDialog', () => {
	beforeEach(() => jest.clearAllMocks());

	it('creates the account and reports its id', async () => {
		mockCreate.mockResolvedValue({ ok: true, data: { id: 'off1', username: 'sunrise_tower' } });
		open();
		fill('  Sunrise Tower  ', 'Sunrise_Tower');
		await waitFor(() => expect(onCreated).toHaveBeenCalledWith('off1', 'sunrise_tower'));
		expect(mockCreate).toHaveBeenCalledWith('sunrise_tower', 'Sunrise Tower');
	});

	it('refuses a blank name and an invalid or reserved username without sending', () => {
		open();
		fill('   ', 'sunrise');
		expect(screen.getByText('Enter the group’s name.')).toBeInTheDocument();
		fill('Sunrise', 'ab');
		expect(screen.getByText(/Usernames are 3–50/)).toBeInTheDocument();
		fill('Sunrise', 'admin');
		expect(screen.getByText(/reserved/)).toBeInTheDocument();
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('shows a taken username next to its field', async () => {
		mockCreate.mockResolvedValue({ ok: false, status: 409, errorCode: 'user.username.taken', message: 'raw' });
		open();
		fill('Sunrise', 'sunrise');
		expect(await screen.findByText('Username already taken')).toBeInTheDocument();
		expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
		expect(onCreated).not.toHaveBeenCalled();
	});

	it('says the plan’s limit is reached and points to Pro', async () => {
		mockCreate.mockResolvedValue({ ok: false, status: 403, errorCode: 'community.limit_reached', message: 'raw' });
		open();
		fill('Sunrise', 'sunrise');
		expect(await screen.findByRole('alert')).toHaveTextContent(
			'You already own as many community accounts as your plan allows. Upgrade to Pro to own more.'
		);
	});

	it('shows any other failure in the dialog', async () => {
		mockCreate.mockResolvedValue({ ok: false, status: 502, message: 'Request failed' });
		open();
		fill('Sunrise', 'sunrise');
		expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t create the account. Please try again.');
	});
});
