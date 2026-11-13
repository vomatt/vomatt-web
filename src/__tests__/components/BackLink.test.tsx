import { fireEvent, render, screen } from '@testing-library/react';

import { BackLink } from '@/components/BackLink';

const back = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ back, refresh: jest.fn() }) }));

function setCanGoBack(canGoBack: boolean | undefined) {
	Object.defineProperty(window, 'navigation', {
		configurable: true,
		value: canGoBack === undefined ? undefined : { canGoBack },
	});
}

beforeEach(() => back.mockReset());
afterAll(() => setCanGoBack(undefined));

function clickBack() {
	const event = new MouseEvent('click', { bubbles: true, cancelable: true });
	fireEvent(screen.getByRole('link', { name: 'Back' }), event);
	return event;
}

describe('BackLink', () => {
	it('returns to the previous page in the app', () => {
		setCanGoBack(true);
		render(<BackLink href="/">Back</BackLink>);

		const event = clickBack();

		expect(back).toHaveBeenCalledTimes(1);
		expect(event.defaultPrevented).toBe(true);
	});

	it('follows its href when the page was opened directly', () => {
		setCanGoBack(false);
		render(<BackLink href="/">Back</BackLink>);

		const event = clickBack();

		expect(back).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
		expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/');
	});

	it('follows its href when the browser has no Navigation API', () => {
		setCanGoBack(undefined);
		render(<BackLink href="/">Back</BackLink>);

		clickBack();

		expect(back).not.toHaveBeenCalled();
	});

	it('with strict, follows its href unless the previous page is that href', () => {
		Object.defineProperty(window, 'navigation', {
			configurable: true,
			value: {
				canGoBack: true,
				currentEntry: { index: 1 },
				entries: () => [{ url: 'http://localhost/notifications' }, { url: 'http://localhost/settings' }],
				addEventListener: jest.fn(),
			},
		});
		render(
			<BackLink href="/me" strict>
				Back
			</BackLink>
		);

		const event = clickBack();

		expect(back).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
	});
});
