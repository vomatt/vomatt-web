import { render } from '@testing-library/react';

import { StatusChip } from '@/features/polls/components/StatusChip';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

const HOUR = 3600_000;
const poll = { startTime: new Date(Date.now() - HOUR).toISOString(), endTime: new Date(Date.now() + HOUR).toISOString() };
const ping = (container: HTMLElement) => container.querySelector('[class*="animate-ping"]');

describe('StatusChip', () => {
	it('pulses while the poll is closing', () => {
		const { container } = render(<StatusChip status="closing" poll={poll} />);
		expect(ping(container)).not.toBeNull();
	});

	it('shows a still dot while the poll is open', () => {
		const { container } = render(<StatusChip status="open" poll={poll} />);
		expect(ping(container)).toBeNull();
	});
});
