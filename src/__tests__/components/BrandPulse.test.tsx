import { render, screen, within } from '@testing-library/react';

import { BrandPulse } from '@/components/BrandPulse';

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

/** Runs the fallback's inline script the way the browser does while parsing the streamed HTML. */
function runInlineScript(container: HTMLElement) {
	const script = container.querySelector('script')!;
	Object.defineProperty(document, 'currentScript', { value: script, configurable: true });
	new Function(script.textContent!)();
}

const announced = (status: HTMLElement) => within(status).queryByText('Loading', { ignore: 'script, [hidden] *' });

describe('BrandPulse', () => {
	it('stays silent for a quick load', () => {
		const { container } = render(<BrandPulse />);
		runInlineScript(container);
		jest.advanceTimersByTime(299);
		expect(announced(screen.getByRole('status'))).toBeNull();
	});

	it('announces loading once the wordmark shows', () => {
		const { container } = render(<BrandPulse />);
		runInlineScript(container);
		jest.advanceTimersByTime(300);
		expect(announced(screen.getByRole('status'))).not.toBeNull();
	});
});
