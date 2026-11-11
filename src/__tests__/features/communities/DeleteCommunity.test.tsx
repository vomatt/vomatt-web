import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { DeleteCommunity } from '@/features/communities/DeleteCommunity';
import en from '@/locales/en.json';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
const mockRefresh = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh, replace: mockReplace }) }));
const mockDelete = jest.fn();
jest.mock('@/features/communities/service', () => ({ deleteCommunity: (...a: unknown[]) => mockDelete(...a) }));

beforeEach(() => {
	jest.clearAllMocks();
	mockDelete.mockResolvedValue({ ok: true, data: undefined });
	render(
		<DeleteCommunity
			community={{ communityId: 'c1', username: 'sunrise', displayName: 'Sunrise', avatarUrl: null, role: 'OWNER' }}
		/>
	);
	fireEvent.click(screen.getByRole('button', { name: en.communities.deleteCtaEllipsis }));
});

const confirmField = () => screen.getByRole('textbox', { name: en.communities.deleteConfirmLabel });
const confirm = () => fireEvent.click(screen.getByRole('button', { name: en.communities.deleteCta }));

describe('DeleteCommunity', () => {
	it('asks for the username before deleting', () => {
		expect(screen.getByRole('alertdialog', { name: 'Delete @sunrise?' })).toBeInTheDocument();
		confirm();
		expect(screen.getByText('Type sunrise to delete this account.')).toBeInTheDocument();
		expect(mockDelete).not.toHaveBeenCalled();
	});

	it('deletes on a match and goes back to Settings', async () => {
		fireEvent.change(confirmField(), { target: { value: ' Sunrise ' } });
		confirm();
		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/settings#communities'));
		expect(mockDelete).toHaveBeenCalledWith('c1');
		expect(toast.success).toHaveBeenCalledWith('Deleted @sunrise');
	});

	it('stays put and says why when the API refuses', async () => {
		mockDelete.mockResolvedValue({ ok: false, status: 403, errorCode: 'community.role_forbidden', message: 'x' });
		fireEvent.change(confirmField(), { target: { value: 'sunrise' } });
		confirm();
		await waitFor(() => expect(toast.error).toHaveBeenCalled());
		expect(mockReplace).not.toHaveBeenCalled();
		expect(mockRefresh).toHaveBeenCalled();
	});
});
