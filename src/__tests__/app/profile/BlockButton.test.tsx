import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import BlockButton from '@/app/(frontend)/[slug]/_components/BlockButton';
import { blockUserByUsername } from '@/features/blocks/service';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/features/blocks/service', () => ({ blockUserByUsername: jest.fn() }));

const mockBlock = blockUserByUsername as jest.Mock;

beforeEach(() => jest.resetAllMocks());

it('blocks only after the confirmation', async () => {
	mockBlock.mockResolvedValue({ ok: true, data: { found: true } });
	render(<BlockButton username="bob" />);

	fireEvent.click(screen.getByRole('button', { name: 'Block' }));
	expect(await screen.findByText('Block @bob?')).toBeInTheDocument();
	expect(mockBlock).not.toHaveBeenCalled();

	fireEvent.click(screen.getAllByRole('button', { name: 'Block' }).at(-1)!);
	await waitFor(() => expect(mockBlock).toHaveBeenCalledWith('bob'));
	await waitFor(() => expect(toast.success).toHaveBeenCalled());
});

it('says so when the block fails', async () => {
	mockBlock.mockResolvedValue({ ok: false, message: 'x' });
	render(<BlockButton username="bob" />);

	fireEvent.click(screen.getByRole('button', { name: 'Block' }));
	await screen.findByText('Block @bob?');
	fireEvent.click(screen.getAllByRole('button', { name: 'Block' }).at(-1)!);
	await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Couldn’t block. Try again.', { duration: Infinity }));
});
