import { redirect } from 'next/navigation';

import { getMyProfile, redirectToLogin } from '@/data/auth';
import { profileHref } from '@/lib/routes';

// My Polls folded into Profile › Asked, where the owner's drafts and controls live now
export default async function MyPollsPage() {
	const profile = await getMyProfile();
	if (!profile) return redirectToLogin('/my-polls');
	redirect(profileHref(profile.username));
}
