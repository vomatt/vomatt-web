import type { PollStatus } from '@/features/polls/status';
import { pollTiming, statusWord, type ViewerClock } from '@/features/polls/timing';
import { interpolate, type TranslationValues } from '@/lib/interpolate';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';
import type { LanguageCode } from '@/types';

// Jest runs in Asia/Taipei (jest.config.ts). Wednesday 28 October 2026, 10:00 there.
const NOW = Date.parse('2026-10-28T10:00:00+08:00');
const HOUR = 3600_000;
const taipei = (local: string) => new Date(`${local}+08:00`).toISOString();

const STRINGS = { en, zh };
const clock = (language: LanguageCode): ViewerClock => ({
	now: NOW,
	language,
	t: (key: string, values?: string | TranslationValues) => {
		const value = key.split('.').reduce<any>((node, part) => node?.[part], STRINGS[language]);
		if (typeof value !== 'string') return key;
		return typeof values === 'object' ? interpolate(value, values) : value;
	},
});

const started = taipei('2026-10-20T09:00:00');

describe('pollTiming', () => {
	it.each<[string, LanguageCode, PollStatus, { startTime: string; endTime: string | null }, string, string | null]>([
		// Scheduled: the chip and the meta say the same "Opens …"
		['scheduled, next week within six days', 'en', 'scheduled', { startTime: taipei('2026-11-02T09:00:00'), endTime: null }, 'Opens Mon 9:00', 'Opens Mon 9:00'],
		['scheduled, next week within six days', 'zh', 'scheduled', { startTime: taipei('2026-11-02T09:00:00'), endTime: null }, '週一 9:00 開始', '週一 9:00 開始'],
		['scheduled, a week or more away', 'en', 'scheduled', { startTime: taipei('2026-11-04T09:00:00'), endTime: null }, 'Opens Nov 4, 9:00', 'Opens Nov 4, 9:00'],
		['scheduled, a week or more away', 'zh', 'scheduled', { startTime: taipei('2026-11-04T09:00:00'), endTime: null }, '11月4日 9:00 開始', '11月4日 9:00 開始'],
		['scheduled, tomorrow', 'en', 'scheduled', { startTime: taipei('2026-10-29T09:00:00'), endTime: null }, 'Opens tomorrow at 9:00', 'Opens tomorrow at 9:00'],
		// Open: the chip names the day, the meta the moment
		['open', 'en', 'open', { startTime: started, endTime: taipei('2026-10-30T20:00:00') }, 'Open · ends Fri', 'ends Fri 20:00'],
		['open', 'zh', 'open', { startTime: started, endTime: taipei('2026-10-30T20:00:00') }, '進行中 · 週五截止', '週五 20:00 結束'],
		['open, ending next week', 'en', 'open', { startTime: started, endTime: taipei('2026-11-06T20:00:00') }, 'Open · ends Nov 6', 'ends Nov 6, 20:00'],
		// Open without an end: the word alone, nothing for the meta
		['open without an end', 'en', 'open', { startTime: started, endTime: null }, 'Open', null],
		['open without an end', 'zh', 'open', { startTime: started, endTime: null }, '進行中', null],
		// Closing: one duration for the chip and the meta
		['closing', 'en', 'closing', { startTime: started, endTime: new Date(NOW + 6 * HOUR).toISOString() }, 'Ends in 6h', 'ends in 6h'],
		['closing', 'zh', 'closing', { startTime: started, endTime: new Date(NOW + 6 * HOUR).toISOString() }, '6 小時後截止', '6 小時後截止'],
		// Ended: the day it ended; the meta says the outcome instead
		['ended this week', 'en', 'ended', { startTime: started, endTime: taipei('2026-10-26T18:00:00') }, 'Ended Mon', null],
		['ended this week', 'zh', 'ended', { startTime: started, endTime: taipei('2026-10-26T18:00:00') }, '週一結束', null],
		['ended last week', 'en', 'ended', { startTime: started, endTime: taipei('2026-10-21T18:00:00') }, 'Ended Oct 21', null],
		['ended yesterday', 'en', 'ended', { startTime: started, endTime: taipei('2026-10-27T18:00:00') }, 'Ended yesterday', null],
		['ended without an end time', 'en', 'ended', { startTime: started, endTime: null }, 'Ended', null],
		['ended without an end time', 'zh', 'ended', { startTime: started, endTime: null }, '已結束', null],
	])('%s (%s)', (_case, language, status, poll, chip, when) => {
		expect(pollTiming(poll, status, clock(language))).toEqual({ chip, when });
	});
});

describe('statusWord', () => {
	it.each<[PollStatus, string, string]>([
		['scheduled', 'Soon', '即將開始'],
		['open', 'Open', '進行中'],
		['closing', 'Closing', '即將截止'],
		['ended', 'Ended', '已結束'],
	])('names %s in both languages', (status, english, chinese) => {
		expect(statusWord(status, clock('en').t)).toBe(english);
		expect(statusWord(status, clock('zh').t)).toBe(chinese);
	});
});
