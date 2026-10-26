import {
	formatAge,
	formatDuration,
	formatFromNow,
	formatPollDay,
	formatPollMoment,
	joinSentences,
} from '@/features/polls/format';

describe('formatFromNow', () => {
	const now = new Date('2026-10-24T12:00:00Z');
	const secondsFromNow = (seconds: number) => new Date(now.getTime() + seconds * 1000).toISOString();

	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(now);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('says "just now" for something under a minute old', () => {
		expect(formatFromNow(secondsFromNow(0), 'en')).toBe('just now');
		expect(formatFromNow(secondsFromNow(-59), 'en')).toBe('just now');
	});

	it('says 剛剛 in Chinese', () => {
		expect(formatFromNow(secondsFromNow(-10), 'zh')).toBe('剛剛');
	});

	it('counts minutes from a minute on', () => {
		expect(formatFromNow(secondsFromNow(-60), 'en')).toBe('1 minute ago');
	});

	it('keeps seconds for a moment under a minute away, so "Ends in…" still reads right', () => {
		expect(formatFromNow(secondsFromNow(30), 'en')).toBe('in 30 seconds');
	});
});

describe('joinSentences', () => {
	it('separates English sentences with a space', () => {
		expect(joinSentences('en', 'Anyone can vote.', 'Only you will see.')).toBe(
			'Anyone can vote. Only you will see.'
		);
	});

	it('runs Chinese sentences together, since 。 already separates them', () => {
		expect(joinSentences('zh', '任何人都能投票。', '只有你會看到。')).toBe('任何人都能投票。只有你會看到。');
	});
});

// Jest runs in Asia/Taipei (jest.config.ts). Wednesday 28 October 2026, 10:00 there.
const NOW = Date.parse('2026-10-28T10:00:00+08:00');
const taipei = (local: string) => new Date(`${local}+08:00`).toISOString();
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatPollDay', () => {
	it.each([
		['2026-10-28T23:59:00', 'today', '今天'],
		['2026-10-29T00:30:00', 'tomorrow', '明天'],
		['2026-10-27T18:00:00', 'yesterday', '昨天'],
		['2026-10-30T20:00:00', 'Fri', '週五'],
		['2026-11-03T09:00:00', 'Tue', '週二'],
		['2026-10-22T09:00:00', 'Thu', '週四'],
		['2026-11-04T09:00:00', 'Nov 4', '11月4日'],
		['2026-10-21T09:00:00', 'Oct 21', '10月21日'],
	])('says %s as "%s" / "%s"', (local, english, chinese) => {
		expect(formatPollDay(taipei(local), 'en', NOW)).toBe(english);
		expect(formatPollDay(taipei(local), 'zh', NOW)).toBe(chinese);
	});

	it("counts calendar days in the viewer's time zone, not 24-hour spans", () => {
		// 01:00 Thursday in Taipei is still Wednesday in UTC, and only 15 hours away
		expect(formatPollDay('2026-10-28T17:00:00Z', 'en', NOW)).toBe('tomorrow');
	});
});

describe('formatPollMoment', () => {
	it.each([
		['2026-10-28T18:00:00', 'today at 18:00', '今天 18:00'],
		['2026-10-29T09:00:00', 'tomorrow at 9:00', '明天 9:00'],
		['2026-10-30T20:00:00', 'Fri 20:00', '週五 20:00'],
		['2026-11-06T20:05:00', 'Nov 6, 20:05', '11月6日 20:05'],
	])('says %s as "%s" / "%s"', (local, english, chinese) => {
		expect(formatPollMoment(taipei(local), 'en', NOW)).toBe(english);
		expect(formatPollMoment(taipei(local), 'zh', NOW)).toBe(chinese);
	});
});

describe('formatDuration', () => {
	it.each([
		[45 * MINUTE, '45m', '45 分鐘'],
		[6 * HOUR + 20 * MINUTE, '6h', '6 小時'],
		[2 * DAY + 3 * HOUR, '2d', '2 天'],
	])('says %i ms as "%s" / "%s"', (ms, english, chinese) => {
		expect(formatDuration(ms, 'en')).toBe(english);
		expect(formatDuration(ms, 'zh')).toBe(chinese);
	});

	it('never says less than a minute', () => {
		expect(formatDuration(10_000, 'en')).toBe('1m');
	});

	it('rounds up into the next unit instead of saying "60m" or "24h"', () => {
		expect(formatDuration(59 * MINUTE + 40_000, 'en')).toBe('1h');
		expect(formatDuration(23 * HOUR + 40 * MINUTE, 'en')).toBe('1d');
	});
});

describe('formatAge', () => {
	const ago = (ms: number) => new Date(NOW - ms).toISOString();

	it.each([
		[30_000, 'now', '剛剛'],
		[45 * MINUTE + 50_000, '45m', '45 分鐘'],
		[2 * HOUR + 50 * MINUTE, '2h', '2 小時'],
		[3 * DAY + 5 * HOUR, '3d', '3 天'],
	])('says an age of %i ms as "%s" / "%s"', (ms, english, chinese) => {
		expect(formatAge(ago(ms), 'en', NOW)).toBe(english);
		expect(formatAge(ago(ms), 'zh', NOW)).toBe(chinese);
	});

	it('gives the date from a week on', () => {
		expect(formatAge(taipei('2026-10-07T12:00:00'), 'en', NOW)).toBe('Oct 7');
		expect(formatAge(taipei('2026-10-07T12:00:00'), 'zh', NOW)).toBe('10月7日');
	});
});
