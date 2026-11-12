import { serverNow } from '@/lib/clock';
import { toLocaleTag } from '@/lib/locale';
import type { LanguageCode } from '@/types';

// Building an Intl formatter is costly, so keep one per language
const dateFormatter = (language: LanguageCode) =>
	new Intl.DateTimeFormat(toLocaleTag(language), {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	});
const DATE_FORMATTERS = {
	en: dateFormatter('en'),
	zh: dateFormatter('zh'),
} satisfies Record<LanguageCode, Intl.DateTimeFormat>;

// UTC so the server render and the browser agree on the month
const monthYearFormatter = (language: LanguageCode) =>
	new Intl.DateTimeFormat(toLocaleTag(language), { month: 'short', year: 'numeric', timeZone: 'UTC' });
const MONTH_YEAR_FORMATTERS = {
	en: monthYearFormatter('en'),
	zh: monthYearFormatter('zh'),
} satisfies Record<LanguageCode, Intl.DateTimeFormat>;

/** "Aug 2026" / "2026年8月" */
export function formatMonthYear(iso: string, language: LanguageCode) {
	return MONTH_YEAR_FORMATTERS[language].format(new Date(iso));
}

/** "Oct 7, 22:00" in the reader's language and time zone. */
export function formatPollDate(iso: string, language: LanguageCode) {
	return DATE_FORMATTERS[language].format(new Date(iso));
}

// One per language, built once, like the formatters above
const perLanguage = <T>(make: (locale: string) => T) =>
	({ en: make(toLocaleTag('en')), zh: make(toLocaleTag('zh')) }) satisfies Record<LanguageCode, T>;

const RELATIVE = perLanguage((locale) => new Intl.RelativeTimeFormat(locale, { numeric: 'always' }));
const RELATIVE_DAY = perLanguage((locale) => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }));
const WEEKDAY = perLanguage((locale) => new Intl.DateTimeFormat(locale, { weekday: 'short' }));
const MONTH_DAY = perLanguage((locale) => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }));
const DAY_DATE = perLanguage((locale) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }));
const unitFormat = (unit: 'minute' | 'hour' | 'day') =>
	perLanguage((locale) => new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'narrow' }));
const MINUTES = unitFormat('minute');
const HOURS = unitFormat('hour');
const DAYS = unitFormat('day');

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const JUST_NOW = { en: 'just now', zh: '剛剛' } satisfies Record<LanguageCode, string>;

// Largest first; a month is 30 days and a year 365
const RELATIVE_UNITS = [
	['year', 365 * DAY],
	['month', 30 * DAY],
	['day', DAY],
	['hour', HOUR],
	['minute', MINUTE],
	['second', 1000],
] as const;

/** "in 5 hours" / "5 小時前"; under a minute ago is "just now" / "剛剛" */
export function formatFromNow(iso: string, language: LanguageCode) {
	const age = serverNow() - new Date(iso).getTime();
	// Only the past: a future moment reads "Ends in 30 seconds", never "Ends just now"
	if (age >= 0 && age < MINUTE) return JUST_NOW[language];
	const span = Math.abs(age);
	const [unit, size] = RELATIVE_UNITS.find(([, size]) => span >= size) ?? RELATIVE_UNITS[RELATIVE_UNITS.length - 1];
	// An age floors, like formatAge: 1.6 days is "1 day ago" on both
	const count = age > 0 ? Math.floor(span / size) : Math.round(span / size);
	return RELATIVE[language].format(age > 0 ? -count : count, unit);
}

/** Calendar days from `now` to `date` in the viewer's time zone; rounding absorbs a DST hour. */
function calendarDaysBetween(date: Date, now: number) {
	const midnight = (moment: Date) => new Date(moment.getFullYear(), moment.getMonth(), moment.getDate()).getTime();
	return Math.round((midnight(date) - midnight(new Date(now))) / DAY);
}

/**
 * "today" / "tomorrow" / "yesterday", the weekday within six days ("Fri"), else "Oct 24";
 * zh 今天 / 週五 / 10月24日. Counts calendar days in the viewer's time zone, not 24-hour spans.
 */
export function formatPollDay(iso: string, language: LanguageCode, now: number) {
	const date = new Date(iso);
	const days = calendarDaysBetween(date, now);
	if (Math.abs(days) <= 1) return RELATIVE_DAY[language].format(days, 'day');
	if (Math.abs(days) <= 6) return WEEKDAY[language].format(date);
	return MONTH_DAY[language].format(date);
}

/** "9:00", "20:00": the same 24-hour clock in both languages. */
function formatClock(date: Date) {
	return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** formatPollDay with the time: "today at 18:00", "Fri 20:00", "Oct 24, 20:00"; zh 今天 18:00 / 週五 20:00 / 10月24日 20:00. */
export function formatPollMoment(iso: string, language: LanguageCode, now: number) {
	const date = new Date(iso);
	const day = formatPollDay(iso, language, now);
	const clock = formatClock(date);
	if (language === 'zh') return `${day} ${clock}`;
	const days = Math.abs(calendarDaysBetween(date, now));
	if (days <= 1) return `${day} at ${clock}`;
	return days <= 6 ? `${day} ${clock}` : `${day}, ${clock}`;
}

/** The largest whole unit, rounded, at least a minute: "45m", "6h", "2d"; zh 45 分鐘 / 6 小時 / 2 天. */
export function formatDuration(ms: number, language: LanguageCode) {
	const minutes = Math.max(1, Math.round(ms / MINUTE));
	if (minutes < 60) return MINUTES[language].format(minutes);
	// 59.6 minutes rounds up to "1h", not "60m"; the same at the day line
	const hours = Math.round(ms / HOUR);
	if (hours < 24) return HOURS[language].format(hours);
	return DAYS[language].format(Math.round(ms / DAY));
}

const NOW = { en: 'now', zh: '剛剛' } satisfies Record<LanguageCode, string>;

/** A post's age for an author line: "now" (剛剛) under a minute, "45m", "2h", "3d", then "Oct 7". */
export function formatAge(iso: string, language: LanguageCode, now: number) {
	const age = now - Date.parse(iso);
	if (age < MINUTE) return NOW[language];
	if (age < HOUR) return MINUTES[language].format(Math.floor(age / MINUTE));
	if (age < DAY) return HOURS[language].format(Math.floor(age / HOUR));
	if (age < 7 * DAY) return DAYS[language].format(Math.floor(age / DAY));
	return MONTH_DAY[language].format(new Date(iso));
}

/** Sentences as one paragraph: a space between them in English, none after Chinese 。 */
export function joinSentences(language: LanguageCode, ...sentences: string[]) {
	return sentences.join(language === 'zh' ? '' : ' ');
}

/** "Nov 9, 2026" / "2026年11月9日", in the reader's time zone. */
export function formatDate(iso: string, language: LanguageCode) {
	return DAY_DATE[language].format(new Date(iso));
}
