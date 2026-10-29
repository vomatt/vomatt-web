import { APP_ROOT_SEGMENTS } from '@/lib/routes';
import { getPageSlugs } from '@/sanity/lib/pageSlugs';

// Root segments that are not usernames
const EXCLUDED_ROOTS = [...APP_ROOT_SEGMENTS, 'sanity', 'api'];

type Component = { '/': string; exclude?: true; comment?: string };

/**
 * Universal links for the iOS app: polls and profiles open in the app, every
 * other path stays on the web. webcredentials lets the app use this domain's passkeys. iOS uses the first component that matches, and
 * `*` matches across `/`, so excludes come before the catch-all profile rule.
 * Not served (404) until IOS_APP_IDS is set.
 */
export async function GET() {
	const appIDs = (process.env.IOS_APP_IDS ?? '')
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean);
	if (appIDs.length === 0) return new Response(null, { status: 404 });

	// Sanity pages share the root with profiles; a Sanity slug wins over a username
	const sanitySlugs = await getPageSlugs().catch((error) => {
		console.error('AASA: could not load Sanity page slugs', error);
		return [] as string[];
	});

	const components: Component[] = [
		{ '/': '/poll/*', comment: 'Poll' },
		{ '/': '/', exclude: true },
		...[...EXCLUDED_ROOTS, ...sanitySlugs].map((root): Component => ({ '/': `/${root}`, exclude: true })),
		{ '/': '/*/*', exclude: true, comment: 'Profiles are a single segment' },
		{ '/': '/*.*', exclude: true, comment: 'Files; usernames have no dots' },
		{ '/': '/*', comment: 'Profile' },
	];

	return Response.json({
		applinks: { details: [{ appIDs, components }] },
		webcredentials: { apps: appIDs },
	});
}
