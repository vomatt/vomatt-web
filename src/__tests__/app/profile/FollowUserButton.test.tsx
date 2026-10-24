import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import FollowUserButton from '@/app/(frontend)/[slug]/_components/FollowUserButton';
import { followUserByUsername } from '@/features/follows/service';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/features/follows/service', () => ({ followUserByUsername: jest.fn() }));

const mockFollow = followUserByUsername as jest.Mock;

beforeEach(() => jest.resetAllMocks());

it('follows the user and confirms', async () => {
	mockFollow.mockResolvedValue({ ok: true, data: { found: true } });
	render(<FollowUserButton username="bob" />);

	fireEvent.click(screen.getByRole('button', { name: 'Follow' }));
	await waitFor(() => expect(mockFollow).toHaveBeenCalledWith('bob'));
	await waitFor(() => expect(toast.success).toHaveBeenCalled());
});

it('says so when the follow fails', async () => {
	mockFollow.mockResolvedValue({ ok: false, message: 'x' });
	render(<FollowUserButton username="bob" />);

	fireEvent.click(screen.getByRole('button', { name: 'Follow' }));
	await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Couldn’t follow. Try again.', { duration: Infinity }));
});
