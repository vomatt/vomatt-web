import type { useLanguage } from '@/contexts/LanguageContext';
import type { LanguageCode } from '@/types';

import { toPayloadLocale } from './locale';

type Translate = ReturnType<typeof useLanguage>['t'];

/**
 * A "{count} …" string in the language's plural form: `key_one` for a count of one where the
 * language has that form (en), `key` otherwise; the count is grouped for the locale (1,200).
 */
export function countText(t: Translate, key: string, count: number, language: LanguageCode) {
	const locale = toPayloadLocale(language);
	const one = new Intl.PluralRules(locale).select(count) === 'one';
	return t(one ? `${key}_one` : key, { count: count.toLocaleString(locale) });
}
