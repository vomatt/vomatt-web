import { render } from '@testing-library/react';

import { StatusChip } from '@/features/polls/components/StatusChip';
import type { PollStatus } from '@/features/polls/status';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

// False stands in for the server render and hydration
let mockHydrated = true;
jest.mock('@/hooks/useHydrated', () => ({ useHydrated: () => mockHydrated }));
afterEach(() => {
	mockHydrated = true;
});

const HOUR = 3600_000;
const poll = { startTime: new Date(Date.now() - HOUR).toISOString(), endTime: new Date(Date.now() + HOUR).toISOString() };
const chip = (container: HTMLElement) => container.querySelector('span');

describe('StatusChip', () => {
	it.each<PollStatus>(['scheduled', 'open', 'closing', 'ended'])('gives the %s status its own tint', (status) => {
		const { container } = render(<StatusChip status={status} poll={poll} />);
		expect(chip(container)).toHaveClass(`bg-status-${status}`);
	});

	it('always carries a text label, so status never relies on color alone', () => {
		const { container } = render(<StatusChip status="closing" poll={poll} />);
		expect(chip(container)?.textContent?.trim()).not.toBe('');
	});

	it('stays still while the poll is closing', () => {
		const { container } = render(<StatusChip status="closing" poll={poll} />);
		expect(container.querySelector('[class*="animate-"]')).toBeNull();
	});

	it('holds its height with an invisible chip until hydration', () => {
		mockHydrated = false;
		const { container } = render(<StatusChip status="open" poll={poll} />);
		expect(chip(container)).toHaveClass('invisible');
		expect(chip(container)).toHaveAttribute('aria-hidden');
	});

	it('renders nothing for an open poll without an end, even before hydration', () => {
		const open = { startTime: poll.startTime, endTime: null };
		expect(render(<StatusChip status="open" poll={open} />).container).toBeEmptyDOMElement();
		mockHydrated = false;
		expect(render(<StatusChip status="open" poll={open} />).container).toBeEmptyDOMElement();
	});
});
