import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { KeepCommunitiesDialog } from '@/features/communities/KeepCommunitiesDialog';
import type { MyCommunity } from '@/features/communities/schema';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
const mockKeep = jest.fn();
jest.mock('@/features/communities/service', () => ({ keepCommunities: (...args: unknown[]) => mockKeep(...args) }));

const community = (communityId: string, role: MyCommunity['role'] = 'OWNER'): MyCommunity => ({
	communityId,
	username: communityId,
	displayName: null,
	avatarUrl: null,
	role,
});
const communities = [community('alpha'), community('beta'), community('gamma'), community('delta', 'EDITOR')];
const onOpenChange = jest.fn();

function open(limit: number, list = communities) {
	render(
		<KeepCommunitiesDialog
			open
			onOpenChange={onOpenChange}
			quota={{ owned: 3, limit, selectionRequired: true, selectionDeadline: '2026-11-18T10:00:00Z' }}
			communities={list}
		/>
	);
}

const keep = () => screen.getByRole('button', { name: 'Keep these' });

describe('KeepCommunitiesDialog', () => {
	beforeEach(() => jest.clearAllMocks());

	it('lists only the accounts the user owns, with the deadline', () => {
		open(1);
		expect(screen.getAllByRole('checkbox').map((box) => box.closest('label')!.textContent)).toEqual([
			'alpha@alpha',
			'beta@beta',
			'gamma@gamma',
		]);
		expect(screen.getByRole('dialog')).toHaveTextContent('Choose by Nov 18, 2026, or the earliest created are kept.');
	});

	it('takes exactly the plan’s limit: no fewer, and no more can be ticked', async () => {
		mockKeep.mockResolvedValue({ ok: true, data: undefined });
		open(2);
		expect(keep()).toBeDisabled();
		fireEvent.click(screen.getByLabelText(/alpha/));
		expect(keep()).toBeDisabled();
		expect(screen.getByText('1 of 2 chosen')).toBeInTheDocument();
		fireEvent.click(screen.getByLabelText(/gamma/));
		expect(keep()).toBeEnabled();
		expect(screen.getByLabelText(/beta/)).toBeDisabled();

		fireEvent.click(keep());
		await waitFor(() => expect(mockKeep).toHaveBeenCalledWith(['alpha', 'gamma']));
		expect(toast.success).toHaveBeenCalledWith('Your choice is saved. The others are locked.');
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(mockRefresh).toHaveBeenCalled();
	});

	it('asks for every owned account when there are fewer than the limit', () => {
		open(3, [community('alpha'), community('beta')]);
		fireEvent.click(screen.getByLabelText(/alpha/));
		expect(keep()).toBeDisabled();
		fireEvent.click(screen.getByLabelText(/beta/));
		expect(keep()).toBeEnabled();
	});

	it('shows a refused choice in the dialog', async () => {
		mockKeep.mockResolvedValue({ ok: false, status: 400, errorCode: 'community.keep.invalid', message: 'raw' });
		open(1);
		fireEvent.click(screen.getByLabelText(/alpha/));
		fireEvent.click(keep());
		expect(await screen.findByRole('alert')).toHaveTextContent('Choose only accounts you own, as many as your plan allows.');
		expect(onOpenChange).not.toHaveBeenCalled();
	});
});
