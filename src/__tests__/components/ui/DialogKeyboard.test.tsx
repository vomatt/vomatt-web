import { act, render, screen, waitFor } from '@testing-library/react';

import { AlertDialog, AlertDialogContent, AlertDialogTitle } from '@/components/ui/AlertDialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

const original = Object.getOwnPropertyDescriptor(window, 'visualViewport');
const viewport = Object.assign(new EventTarget(), { width: 375, height: 0, offsetTop: 0, scale: 1 });
const resize = (height: number, offsetTop: number) =>
	act(() => {
		Object.assign(viewport, { height, offsetTop });
		viewport.dispatchEvent(new Event('resize'));
	});

beforeEach(() => {
	Object.assign(viewport, { width: 375, height: window.innerHeight, offsetTop: 0, scale: 1 });
	Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true });
});
afterEach(() => {
	if (original) Object.defineProperty(window, 'visualViewport', original);
	else delete (window as { visualViewport?: unknown }).visualViewport;
});

type Props = { style?: React.CSSProperties; initialFocus?: false };

describe.each([
	[
		'DialogContent',
		'dialog-content',
		(props: Props) => (
			<Dialog open>
				<DialogContent closeLabel="Close" {...props}>
					<DialogTitle>Edit</DialogTitle>
					<input aria-label="Name" />
				</DialogContent>
			</Dialog>
		),
	],
	[
		'AlertDialogContent',
		'alert-dialog-content',
		(props: Props) => (
			<AlertDialog open>
				<AlertDialogContent {...props}>
					<AlertDialogTitle>Sure?</AlertDialogTitle>
					<input aria-label="Name" />
				</AlertDialogContent>
			</AlertDialog>
		),
	],
])('%s with an on-screen keyboard', (_, slot, ui) => {
	const popup = () => document.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
	// The dialog's initial focus lands on the field a moment after it opens
	const focusesField = () => waitFor(() => expect(screen.getByLabelText('Name')).toHaveFocus());

	it('fits what the keyboard leaves visible, then returns to its own layout when it closes', async () => {
		render(ui({}));
		await focusesField();
		expect(popup()).not.toHaveAttribute('data-keyboard');

		resize(400, 100);
		expect(popup()).toHaveAttribute('data-keyboard');
		expect(popup().style.getPropertyValue('--visible-center')).toBe('300px');
		expect(popup().style.getPropertyValue('--visible-height')).toBe('400px');
		expect(popup()).toHaveClass('data-keyboard:top-(--visible-center)', 'data-keyboard:max-h-[calc(var(--visible-height)-2rem)]');

		// The field loses focus as the keyboard goes, and iOS may send no resize after that.
		// (Focus moves to the popup: jsdom has no layout, so Base UI would hand a plain blur back to the "hidden" field.)
		act(() => popup().focus());
		await waitFor(() => expect(popup()).not.toHaveAttribute('data-keyboard'));
		expect(popup().style.getPropertyValue('--visible-center')).toBe('');
		expect(popup().style.getPropertyValue('--visible-height')).toBe('');
	});

	it('ignores a short viewport while no text field is focused', () => {
		render(ui({ initialFocus: false }));
		resize(400, 0);
		expect(popup()).not.toHaveAttribute('data-keyboard');
	});

	it("keeps the dialog's own style", async () => {
		render(ui({ style: { zIndex: 60 } }));
		await focusesField();
		resize(400, 0);
		expect(popup().style.zIndex).toBe('60');
		expect(popup().style.getPropertyValue('--visible-height')).toBe('400px');
	});
});
