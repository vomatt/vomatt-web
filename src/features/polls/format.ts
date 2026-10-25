import { formatDistanceToNowStrict } from 'date-fns';
import { enUS, zhTW } from 'date-fns/locale';

import { toPayloadLocale } from '@/lib/locale';
import type { LanguageCode } from '@/types';

const DATE_FNS_LOCALES = { en: enUS, zh: zhTW } satisfies Record<LanguageCode, unknown>;

// Building an Intl formatter is costly, so keep one per language
const dateFormatter = (language: LanguageCode) =>
	new Intl.DateTimeFormat(toPayloadLocale(language), {
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
	new Intl.DateTimeFormat(toPayloadLocale(language), { month: 'short', year: 'numeric', timeZone: 'UTC' });
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

const JUST_NOW = { en: 'just now', zh: '剛剛' } satisfies Record<LanguageCode, string>;

/** "in 5 hours" / "5 小時前"; under a minute ago is "just now" / "剛剛" */
export function formatFromNow(iso: string, language: LanguageCode) {
	const age = Date.now() - new Date(iso).getTime();
	// Only the past: a future moment reads "Ends in 30 seconds", never "Ends just now"
	if (age >= 0 && age < 60_000) return JUST_NOW[language];
	return formatDistanceToNowStrict(new Date(iso), {
		addSuffix: true,
		locale: DATE_FNS_LOCALES[language],
	});
}

/** Sentences as one paragraph: a space between them in English, none after Chinese 。 */
export function joinSentences(language: LanguageCode, ...sentences: string[]) {
	return sentences.join(language === 'zh' ? '' : ' ');
}
