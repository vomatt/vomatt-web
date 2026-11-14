/**
 * @jest-environment node
 */
import { connection } from 'next/server';

import { ClockSync } from '@/components/ClockSync';
import { ServerClock } from '@/components/ServerClock';
import { syncClock } from '@/lib/clock';

jest.mock('next/server', () => ({ connection: jest.fn() }));
jest.mock('@/lib/clock', () => ({ syncClock: jest.fn() }));

const NOW = Date.parse('2026-11-12T12:00:00Z');

afterEach(() => jest.restoreAllMocks());

it('reads the time only once a request has arrived', async () => {
	const now = jest.spyOn(Date, 'now').mockReturnValue(NOW);
	(connection as jest.Mock).mockImplementation(async () => expect(now).not.toHaveBeenCalled());

	const element = await ServerClock();
	expect(connection).toHaveBeenCalled();
	expect(element.props).toEqual({ serverTime: NOW });
});

it('leaves the server’s own clock alone when rendered there', () => {
	// No window in this environment, as in a server render
	ClockSync({ serverTime: NOW });
	expect(syncClock).not.toHaveBeenCalled();
});
