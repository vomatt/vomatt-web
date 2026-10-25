import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { toast } from 'sonner';

import BlockButton from '@/app/(frontend)/[slug]/_components/BlockButton';
import { blockUser, unblockUser } from '@/features/blocks/service';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/features/blocks/service', () => ({ blockUser: jest.fn(), unblockUser: jest.fn() }));

const mockBlock = blockUser as jest.Mock;
const mockUnblock = unblockUser as jest.Mock;

beforeEach(() => jest.resetAllMocks());

it('blocks only after the confirmation', async () => {
	mockBlock.mockResolvedValue({ ok: true, data: undefined });
	const onChange = jest.fn();
	render(<BlockButton userId="u1" username="bob" isBlocked={false} onChange={onChange} />);

	fireEvent.click(screen.getByRole('button', { name: 'Block' }));
	expect(await screen.findByText('Block @bob?')).toBeInTheDocument();
	expect(mockBlock).not.toHaveBeenCalled();

	fireEvent.click(screen.getAllByRole('button', { name: 'Block' }).at(-1)!);
	await waitFor(() => expect(mockBlock).toHaveBeenCalledWith('u1'));
	await waitFor(() => expect(onChange).toHaveBeenCalledWith(true));
	expect(toast.success).toHaveBeenCalled();
});

it('says so when the block fails', async () => {
	mockBlock.mockResolvedValue({ ok: false, message: 'x' });
	const onChange = jest.fn();
	render(<BlockButton userId="u1" username="bob" isBlocked={false} onChange={onChange} />);

	fireEvent.click(screen.getByRole('button', { name: 'Block' }));
	await screen.findByText('Block @bob?');
	fireEvent.click(screen.getAllByRole('button', { name: 'Block' }).at(-1)!);
	await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Couldn’t block. Try again.', { duration: Infinity }));
	expect(onChange).not.toHaveBeenCalled();
});

it('unblocks a blocked user without a confirmation', async () => {
	mockUnblock.mockResolvedValue({ ok: true, data: undefined });
	const onChange = jest.fn();
	render(<BlockButton userId="u1" username="bob" isBlocked onChange={onChange} />);

	fireEvent.click(screen.getByRole('button', { name: 'Unblock' }));
	await waitFor(() => expect(mockUnblock).toHaveBeenCalledWith('u1'));
	await waitFor(() => expect(onChange).toHaveBeenCalledWith(false));
});

it('moves focus to Unblock once the block lands', async () => {
	mockBlock.mockResolvedValue({ ok: true, data: undefined });
	function Harness() {
		const [isBlocked, setIsBlocked] = useState(false);
		return <BlockButton userId="u1" username="bob" isBlocked={isBlocked} onChange={setIsBlocked} />;
	}
	render(<Harness />);

	fireEvent.click(screen.getByRole('button', { name: 'Block' }));
	await screen.findByText('Block @bob?');
	fireEvent.click(screen.getAllByRole('button', { name: 'Block' }).at(-1)!);
	await waitFor(() => expect(screen.getByRole('button', { name: 'Unblock' })).toHaveFocus());
});
