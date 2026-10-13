import { redirect } from 'next/navigation';

import { getMyProfile } from '@/data/auth';
import { profileHref } from '@/lib/routes';

// The account page is the signed-in user's own profile at /[username]
export default async function Page() {
	const profile = await getMyProfile();
	if (!profile) redirect('/login?redirect=/account');
	redirect(profileHref(profile.username));
}
