import type { LanguageCode } from '@/types';

/**
 * The BCP 47 tag for a language code, for Intl and the API's Accept-Language: our 'zh' is Traditional Chinese, 'zh-TW'.
 */
const LOCALE_TAGS: Record<LanguageCode, string> = {
	en: 'en',
	zh: 'zh-TW',
};

export function toLocaleTag(lang: LanguageCode): string {
	return LOCALE_TAGS[lang] ?? 'en';
}
