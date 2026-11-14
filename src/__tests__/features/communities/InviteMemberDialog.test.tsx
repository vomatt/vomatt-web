import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { InviteMemberDialog } from '@/features/communities/InviteMemberDialog';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('@/lib/api/services/users', () => ({ searchUsers: () => Promise.resolve({ items: [] }) }));

const original = Object.getOwnPropertyDescriptor(window, 'visualViewport');
const viewport = Object.assign(new EventTarget(), { width: 375, height: 0, offsetTop: 0, scale: 1 });

beforeEach(() => {
	Object.assign(viewport, { width: 375, height: window.innerHeight, offsetTop: 0, scale: 1 });
	Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true });
});
afterEach(() => {
	if (original) Object.defineProperty(window, 'visualViewport', original);
	else delete (window as { visualViewport?: unknown }).visualViewport;
});

describe('InviteMemberDialog with an on-screen keyboard', () => {
	it('lets the dialog out of the keyboard layout when a pick replaces the focused field', async () => {
		render(
			<InviteMemberDialog
				open
				onOpenChange={jest.fn()}
				roles={['EDITOR']}
				excludeIds={[]}
				busy={false}
				onInvite={jest.fn()}
			/>
		);
		const popup = () => document.querySelector('[data-slot="dialog-content"]')!;
		const field = screen.getByLabelText('Username or email');
		act(() => field.focus());
		fireEvent.change(field, { target: { value: 'ann@example.com' } });
		act(() => {
			Object.assign(viewport, { height: 400 });
			viewport.dispatchEvent(new Event('resize'));
		});
		expect(popup()).toHaveAttribute('data-keyboard');

		// The field is removed while focused: no focusout, and iOS may send no resize. Focus stays put,
		// as in a browser (jsdom alone has Base UI hand focus to the Remove button, which would mask this).
		const focus = jest.spyOn(HTMLElement.prototype, 'focus').mockImplementation(() => {});
		try {
			fireEvent.click(screen.getByRole('button', { name: 'Invite ann@example.com' }));
			expect(field).not.toBeInTheDocument();
			await waitFor(() => expect(popup()).not.toHaveAttribute('data-keyboard'));
		} finally {
			focus.mockRestore();
		}
	});
});
