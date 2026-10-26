import type { useLanguage } from '@/contexts/LanguageContext';
import type { LanguageCode } from '@/types';

import { toPayloadLocale } from './locale';

export type Translate = ReturnType<typeof useLanguage>['t'];

/**
 * A "{count} …" string in the language's plural form: `key_one` for a count of one where the
 * language has that form (en), `key` otherwise; the count is grouped for the locale (1,200).
 * `values` fills the template's other placeholders.
 */
export function countText(
	t: Translate,
	key: string,
	count: number,
	language: LanguageCode,
	values?: Record<string, string>
) {
	const locale = toPayloadLocale(language);
	const one = new Intl.PluralRules(locale).select(count) === 'one';
	return t(one ? `${key}_one` : key, { ...values, count: count.toLocaleString(locale) });
}
