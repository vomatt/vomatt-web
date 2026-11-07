import { redirect } from 'next/navigation';

import { getMyProfile, redirectToLogin } from '@/data/auth';
import { profileHref } from '@/lib/routes';

// Saved moved to the profile; old links and bookmarks land on its tab
export default async function SavedPage() {
	const me = await getMyProfile();
	if (!me) return redirectToLogin('/following/saved');
	redirect(`${profileHref(me.username)}?tab=saved`);
}
