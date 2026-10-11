/**
 * The live site stays behind the coming soon page until it is turned off in
 * Sanity (Settings → General). If Sanity can't be reached the page stays, so an
 * outage never launches the site early. Local development always shows the site.
 */
export function isComingSoon(
	settings: { comingSoon?: { enabled?: boolean | null } | null } | null,
	env = process.env.NODE_ENV
) {
	return env === 'production' && settings?.comingSoon?.enabled !== false;
}
