import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { CreateCommunityDialog } from '@/features/communities/CreateCommunityDialog';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockCreate = jest.fn();
jest.mock('@/features/communities/service', () => ({
	createCommunity: (...args: unknown[]) => mockCreate(...args),
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn() } }));
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

const onOpenChange = jest.fn();

function open() {
	render(<CreateCommunityDialog open onOpenChange={onOpenChange} />);
}

function fill(name: string, username: string) {
	fireEvent.change(screen.getByLabelText('Group name'), { target: { value: name } });
	fireEvent.change(screen.getByLabelText('Username'), { target: { value: username } });
	fireEvent.click(screen.getByRole('button', { name: 'Create' }));
}

describe('CreateCommunityDialog', () => {
	beforeEach(() => jest.clearAllMocks());

	it('creates the account, closes, and goes to its members page', async () => {
		mockCreate.mockResolvedValue({ ok: true, data: { id: 'off1', username: 'sunrise_tower' } });
		open();
		fill('  Sunrise Tower  ', 'Sunrise_Tower');
		await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/settings/communities/off1/members'));
		expect(mockCreate).toHaveBeenCalledWith('sunrise_tower', 'Sunrise Tower');
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(toast.success).toHaveBeenCalled();
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
		expect(mockPush).not.toHaveBeenCalled();
	});

	it('says the plan’s limit is reached without assuming which plan', async () => {
		mockCreate.mockResolvedValue({ ok: false, status: 403, errorCode: 'community.limit_reached', message: 'raw' });
		open();
		fill('Sunrise', 'sunrise');
		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('You already own as many community accounts as your plan allows.');
		expect(alert).not.toHaveTextContent('Pro');
	});

	it('at the plan’s limit, says so instead of the form, with Upgrade only on Free', () => {
		const { rerender } = render(<CreateCommunityDialog open onOpenChange={onOpenChange} atLimit={{ free: true }} />);
		expect(screen.getByText('Upgrade to Pro to own more.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeInTheDocument();
		expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();

		rerender(<CreateCommunityDialog open onOpenChange={onOpenChange} atLimit={{ free: false }} />);
		expect(screen.getByText('To create another, transfer ownership of one you own.')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Upgrade to Pro' })).not.toBeInTheDocument();
	});

	it('shows any other failure in the dialog', async () => {
		mockCreate.mockResolvedValue({ ok: false, status: 502, message: 'Request failed' });
		open();
		fill('Sunrise', 'sunrise');
		expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t create the account. Please try again.');
	});
});
