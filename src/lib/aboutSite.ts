/** The about site (vomatt-about) serves About and the legal pages from Sanity. */
export const ABOUT_URL = process.env.NEXT_PUBLIC_ABOUT_URL || 'https://about.vomatt.com';

/** Pages that used to live here; next.config.ts redirects them, and they never open in the iOS app. */
export const ABOUT_SITE_SLUGS = ['about', 'privacy-policy', 'terms-of-service', 'cookies-policy'];

/** Old pages that are now part of another page on the about site, so their redirect skips a hop there. */
export const ABOUT_SITE_MOVED: Record<string, string> = { 'cookies-policy': 'privacy-policy' };

export function aboutHref(slug: string) {
	return `${ABOUT_URL}/${slug}`;
}
