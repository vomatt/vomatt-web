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
const chip = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe('StatusChip', () => {
	it.each<PollStatus>(['scheduled', 'open', 'closing', 'ended'])('gives the %s status its own tint', (status) => {
		const { container } = render(<StatusChip status={status} poll={poll} time="inline" />);
		expect(chip(container)).toHaveClass(`bg-status-${status}`);
	});

	it('always carries a text label, so status never relies on color alone', () => {
		const { container } = render(<StatusChip status="closing" poll={poll} time="inline" />);
		expect(chip(container).textContent?.trim()).not.toBe('');
	});

	it('says the time itself when it is inline', () => {
		const { container } = render(<StatusChip status="closing" poll={poll} time="inline" />);
		expect(chip(container)).toHaveTextContent('Ends in 1h');
	});

	it('says only the status word when the time is shown elsewhere', () => {
		const { container } = render(<StatusChip status="closing" poll={poll} time="elsewhere" />);
		expect(chip(container)).toHaveTextContent(/^Closing$/);
	});

	it('marks a closing poll with a clock and every other status with a dot, both hidden from readers', () => {
		const closing = chip(render(<StatusChip status="closing" poll={poll} time="elsewhere" />).container);
		expect(closing.querySelector('svg')).toHaveAttribute('aria-hidden');
		expect(closing.querySelector('.rounded-full')).toBeNull();

		const open = chip(render(<StatusChip status="open" poll={poll} time="elsewhere" />).container);
		expect(open.querySelector('svg')).toBeNull();
		expect(open.querySelector('.rounded-full')).toHaveAttribute('aria-hidden');
	});

	it('stays still while the poll is closing', () => {
		const { container } = render(<StatusChip status="closing" poll={poll} time="inline" />);
		expect(container.querySelector('[class*="animate-"]')).toBeNull();
	});

	it('holds its height with an invisible chip until hydration when it says the time', () => {
		mockHydrated = false;
		const { container } = render(<StatusChip status="open" poll={poll} time="inline" />);
		expect(chip(container)).toHaveClass('invisible');
		expect(chip(container)).toHaveAttribute('aria-hidden');
	});

	it('says the status word on the server when the time is shown elsewhere', () => {
		mockHydrated = false;
		const { container } = render(<StatusChip status="open" poll={poll} time="elsewhere" />);
		expect(chip(container)).not.toHaveClass('invisible');
		expect(chip(container)).toHaveTextContent('Open');
	});

	it.each<PollStatus>(['open', 'closing'])('on a card, gives a %s poll the pink tint and its time without a mark', (status) => {
		const card = chip(render(<StatusChip status={status} poll={poll} time="inline" onCard />).container);
		expect(card).toHaveClass('bg-status-open-ends');
		expect(card.querySelector('svg, .rounded-full')).toBeNull();
		expect(card).toHaveTextContent(/^Ends /);
	});

	it('on a card, keeps the dot on an ended poll', () => {
		const ended = { ...poll, endTime: new Date(Date.now() - HOUR).toISOString() };
		const card = chip(render(<StatusChip status="ended" poll={ended} time="inline" onCard />).container);
		expect(card).toHaveClass('bg-status-ended');
		expect(card.querySelector('.rounded-full')).toHaveAttribute('aria-hidden');
	});

	it('says "Open" for an open poll without an end', () => {
		const open = { startTime: poll.startTime, endTime: null };
		expect(chip(render(<StatusChip status="open" poll={open} time="inline" />).container)).toHaveTextContent(/^Open$/);
	});
});
