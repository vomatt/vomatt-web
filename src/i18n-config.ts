export const i18n = {
	defaultLocale: 'en',
	locales: ['en', 'fr', 'zh-TW'],
} as const;

export type Locale = (typeof i18n)['locales'][number];
