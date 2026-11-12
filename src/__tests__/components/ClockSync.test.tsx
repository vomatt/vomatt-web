import { render } from '@testing-library/react';

import { ClockSync } from '@/components/ClockSync';
import { syncClock } from '@/lib/clock';

jest.mock('@/lib/clock', () => ({ syncClock: jest.fn() }));

it('syncs the browser clock with the server time it was given', () => {
	render(<ClockSync serverTime={1_800_000_000_000} />);
	expect(syncClock).toHaveBeenCalledWith(1_800_000_000_000);
});
