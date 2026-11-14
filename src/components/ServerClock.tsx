import { connection } from 'next/server';

import { ClockSync } from './ClockSync';

/**
 * The server's time for the browser's poll clock (see lib/clock). `connection()` keeps this render
 * at request time wherever it is placed, so the time is never a build or cached one.
 */
export async function ServerClock() {
	await connection();
	// eslint-disable-next-line react-hooks/purity -- a Server Component renders once; the time of that render is the point
	return <ClockSync serverTime={Date.now()} />;
}
