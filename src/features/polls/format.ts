import { formatDistanceToNowStrict } from 'date-fns';
import { enUS, zhTW } from 'date-fns/locale';

import { toPayloadLocale } from '@/lib/locale';
import type { LanguageCode } from '@/types';

const DATE_FNS_LOCALES = { en: enUS, zh: zhTW } satisfies Record<LanguageCode, unknown>;

// Building an Intl formatter is costly, so keep one per language
const dateFormatters = new Map<LanguageCode, Intl.DateTimeFormat>();

/** "Oct 7, 22:00" in the reader's language and time zone. */
export function formatPollDate(iso: string, language: LanguageCode) {
	let formatter = dateFormatters.get(language);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat(toPayloadLocale(language), {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23',
		});
		dateFormatters.set(language, formatter);
	}
	return formatter.format(new Date(iso));
}

/** "in 5 hours" / "5 小時前" */
export function formatFromNow(iso: string, language: LanguageCode) {
	return formatDistanceToNowStrict(new Date(iso), {
		addSuffix: true,
		locale: DATE_FNS_LOCALES[language],
	});
}
