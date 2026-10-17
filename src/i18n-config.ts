export const SUPPORTED_LANGUAGES = {
	en: 'English',
	zh: '繁體中文',
} as const;

export const i18n = {
	defaultLocale: 'en',
	locales: ['en', 'zh'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

/** The BCP 47 tag for `<html lang>`: our Chinese is Traditional, so fonts and voices pick zh-TW. */
export function htmlLang(locale: string) {
	return locale === 'zh' ? 'zh-TW' : locale;
}
