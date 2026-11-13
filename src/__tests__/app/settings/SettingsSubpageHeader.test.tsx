import { fireEvent, render, screen } from '@testing-library/react';

import { SettingsSubpageHeader } from '@/app/(frontend)/settings/_components/SettingsSubpageHeader';

const back = jest.fn();
const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ back, refresh }) }));
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

function setHistory(urls: string[] | undefined) {
	Object.defineProperty(window, 'navigation', {
		configurable: true,
		value: urls && {
			entries: () => urls.map((url) => ({ url: new URL(url, window.location.origin).href })),
			currentEntry: { index: urls.length - 1 },
			addEventListener: (type: string, listener: () => void) => {
				if (type === 'navigatesuccess') navigated = listener;
			},
		},
	});
}

let navigated: (() => void) | undefined;

beforeEach(() => {
	back.mockReset();
	refresh.mockReset();
	navigated = undefined;
});
afterAll(() => setHistory(undefined));

function clickBack(init: MouseEventInit = {}) {
	const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
	fireEvent(screen.getByRole('link'), event);
	return event;
}

describe('SettingsSubpageHeader', () => {
	it('returns to the Settings entry it was opened from instead of adding another', () => {
		setHistory(['/me', '/settings#communities', '/settings/communities/c1/members']);
		render(<SettingsSubpageHeader title="Members" />);

		const event = clickBack();

		expect(back).toHaveBeenCalledTimes(1);
		expect(event.defaultPrevented).toBe(true);
	});

	it('shows Settings as it is now once back on it, not as it was left', () => {
		setHistory(['/settings', '/settings/devices']);
		render(<SettingsSubpageHeader title="Devices" />);

		clickBack();
		expect(refresh).not.toHaveBeenCalled();
		navigated?.();

		expect(refresh).toHaveBeenCalledTimes(1);
	});

	it('opens the link when the previous entry is the same page with a different query', () => {
		setHistory(['/acme?tab=votes', '/settings/communities/c1/members']);
		render(<SettingsSubpageHeader title="Members" back={{ href: '/acme', to: 'profile', name: 'Acme' }} />);

		clickBack();

		expect(back).not.toHaveBeenCalled();
	});

	it('leaves a modified click to open Settings in a new tab', () => {
		setHistory(['/settings', '/settings/devices']);
		render(<SettingsSubpageHeader title="Devices" />);

		const event = clickBack({ metaKey: true });

		expect(back).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
	});

	it('opens Settings when the page was reached from elsewhere', () => {
		setHistory(['/notifications', '/settings/communities/c1/members']);
		render(<SettingsSubpageHeader title="Members" />);

		const event = clickBack();

		expect(back).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
		expect(screen.getByRole('link')).toHaveAttribute('href', '/settings');
	});

	it('returns to the profile it was opened from when that is the way back', () => {
		setHistory(['/acme', '/settings/communities/c1/members']);
		render(<SettingsSubpageHeader title="Members" back={{ href: '/acme', to: 'profile', name: 'Acme' }} />);

		clickBack();

		expect(back).toHaveBeenCalledTimes(1);
	});

	it('opens Settings when the browser has no Navigation API', () => {
		setHistory(undefined);
		render(<SettingsSubpageHeader title="Members" />);

		clickBack();

		expect(back).not.toHaveBeenCalled();
	});
});
