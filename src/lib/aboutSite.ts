import type { Locale } from '@/i18n-config';

/** The about site (vomatt-about) serves About and the legal pages from Sanity. */
export const ABOUT_URL = process.env.NEXT_PUBLIC_ABOUT_URL || 'https://about.vomatt.com';

/** Pages that used to live here; next.config.ts redirects them, and they never open in the iOS app. */
export const ABOUT_SITE_SLUGS = ['about', 'privacy-policy', 'terms-of-service', 'cookies-policy'];

/** Where the about site serves each language; it falls back to English for a page with no translation. */
const LOCALE_PREFIX: Record<Locale, string> = {
	en: '',
	zh: '/zh',
};

export function aboutHref(slug: string, locale: Locale) {
	return `${ABOUT_URL}${LOCALE_PREFIX[locale]}/${slug}`;
}
