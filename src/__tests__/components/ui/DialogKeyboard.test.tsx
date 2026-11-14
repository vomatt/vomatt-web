import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

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

describe('Dialog outside press', () => {
	const setup = () => {
		const onOpenChange = jest.fn();
		render(
			<Dialog open onOpenChange={onOpenChange}>
				<DialogContent closeLabel="Close">
					<DialogTitle>Edit</DialogTitle>
					<input aria-label="Name" />
				</DialogContent>
			</Dialog>
		);
		const backdrop = document.querySelector('[data-slot="dialog-overlay"]')!;
		return { onOpenChange, backdrop };
	};

	it('stays open when a tap that began inside sends its click to the backdrop', async () => {
		// iOS: the keyboard opening or closing mid-tap shifts the popup, and the click, which comes
		// after touchend, hits the backdrop
		const { onOpenChange, backdrop } = setup();
		const field = screen.getByLabelText('Name');
		fireEvent.pointerDown(field, { button: 0, pointerType: 'touch' });
		fireEvent.pointerUp(field, { button: 0, pointerType: 'touch' });
		await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
		fireEvent.click(backdrop);
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('closes on a press-less backdrop click once an earlier tap inside has ended', async () => {
		const { onOpenChange, backdrop } = setup();
		const field = screen.getByLabelText('Name');
		fireEvent.pointerDown(field, { button: 0, pointerType: 'touch' });
		fireEvent.pointerUp(field, { button: 0, pointerType: 'touch' });
		fireEvent.click(field);
		await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
		// Assistive technology activates the backdrop: a click with no pointer press
		fireEvent.click(backdrop);
		expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'outside-press' }));
	});

	it('still closes on a press on the backdrop', () => {
		const { onOpenChange, backdrop } = setup();
		fireEvent.pointerDown(backdrop, { button: 0, pointerType: 'touch' });
		fireEvent.click(backdrop);
		expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'outside-press' }));
	});
});

describe('Dialog with an on-screen keyboard and a field below what is visible', () => {
	const rect = (top: number, bottom: number) => ({ top, bottom, left: 0, right: 300, width: 300, height: bottom - top, x: 0, y: top, toJSON() {} }) as DOMRect;

	it('scrolls the field back into its scroll box once the keyboard is up, and leaves manual scrolling alone', async () => {
		render(
			<Dialog open>
				<DialogContent closeLabel="Close" initialFocus={false}>
					<DialogTitle>Edit</DialogTitle>
					<div data-testid="scroller" style={{ overflowY: 'auto' }}>
						<input aria-label="Name" />
					</div>
				</DialogContent>
			</Dialog>
		);
		const scroller = screen.getByTestId('scroller');
		const field = screen.getByLabelText('Name');
		let scrollTop = 0;
		Object.defineProperties(scroller, {
			scrollHeight: { value: 800 },
			clientHeight: { value: 300 },
			scrollTop: { get: () => scrollTop, set: (value: number) => (scrollTop = value) },
		});
		scroller.getBoundingClientRect = () => rect(0, 300);
		// The field sits below the box's visible part until the box scrolls
		field.getBoundingClientRect = () => rect(500 - scrollTop, 540 - scrollTop);

		act(() => field.focus());
		resize(400, 0);
		await waitFor(() => expect(scrollTop).toBe(256));

		// The visitor scrolls the dialog back up; the viewport scrolling with it moves nothing
		scrollTop = 0;
		act(() => {
			Object.assign(viewport, { offsetTop: 40 });
			viewport.dispatchEvent(new Event('scroll'));
		});
		await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
		expect(scrollTop).toBe(0);

		// Focusing a field again while the keyboard is up reveals it
		act(() => {
			field.blur();
			field.focus();
		});
		await waitFor(() => expect(scrollTop).toBe(256));
	});

	it('reveals the field above the keyboard when the scroll box runs under it (PollCreator from sm)', async () => {
		render(
			<Dialog open>
				<DialogContent closeLabel="Close" initialFocus={false}>
					<DialogTitle>Edit</DialogTitle>
					<div data-testid="scroller" style={{ overflowY: 'auto' }}>
						<input aria-label="Name" />
					</div>
				</DialogContent>
			</Dialog>
		);
		const scroller = screen.getByTestId('scroller');
		const field = screen.getByLabelText('Name');
		let scrollTop = 0;
		Object.defineProperties(scroller, {
			scrollHeight: { value: 1200 },
			clientHeight: { value: 700 },
			scrollTop: { get: () => scrollTop, set: (value: number) => (scrollTop = value) },
		});
		// The box is 700px tall, but the keyboard leaves only the top 400px visible
		scroller.getBoundingClientRect = () => rect(0, 700);
		field.getBoundingClientRect = () => rect(500 - scrollTop, 540 - scrollTop);

		act(() => field.focus());
		resize(400, 0);
		await waitFor(() => expect(scrollTop).toBe(156));
	});
});
