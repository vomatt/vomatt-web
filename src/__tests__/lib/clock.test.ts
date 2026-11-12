const NOW = Date.parse('2026-11-12T12:00:00Z');

/** A fresh module each time: the offset is set once per page load. */
function loadClock() {
	let clock!: typeof import('@/lib/clock');
	jest.isolateModules(() => {
		clock = require('@/lib/clock');
	});
	return clock;
}

beforeEach(() => jest.spyOn(Date, 'now').mockReturnValue(NOW));
afterEach(() => jest.restoreAllMocks());

describe('serverNow()', () => {
	it('is the device clock until synced', () => {
		expect(loadClock().serverNow()).toBe(NOW);
	});

	it.each([
		['behind', 10 * 60_000],
		['ahead', -10 * 60_000],
	])('follows the server when the device clock is %s', (_, skew) => {
		const { serverNow, syncClock } = loadClock();
		syncClock(NOW + skew);
		expect(serverNow()).toBe(NOW + skew);
	});

	it('ignores a difference under a minute, which is the page arriving', () => {
		const { serverNow, syncClock } = loadClock();
		syncClock(NOW - 5_000);
		expect(serverNow()).toBe(NOW);
	});

	it('measures against when the page began to arrive, so a slow load is not read as a wrong clock', () => {
		const { serverNow, syncClock } = loadClock();
		// The response began 90s ago, which is when the server rendered; hydration only runs now
		const timing = { timeOrigin: NOW - 91_000, getEntriesByType: () => [{ responseStart: 1_000 }] };
		const original = global.performance;
		Object.defineProperty(global, 'performance', { value: timing, configurable: true });
		syncClock(NOW - 90_000);
		Object.defineProperty(global, 'performance', { value: original, configurable: true });
		expect(serverNow()).toBe(NOW);
	});

	it('keeps the first sync: a later render may carry an older time', () => {
		const { serverNow, syncClock } = loadClock();
		syncClock(NOW + 10 * 60_000);
		syncClock(NOW - 3_600_000);
		expect(serverNow()).toBe(NOW + 10 * 60_000);
	});
});
