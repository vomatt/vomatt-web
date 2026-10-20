import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { CookieSettingsButton } from '@/components/layout/CookieConsent';
import { getMyProfile } from '@/data/auth';
import { isOwnUsername, usernameFromSlug } from '@/features/account/username';
import { getUserPolls } from '@/features/polls/service';
import { getUserProfile } from '@/lib/api/services/users';
import defineMetadata from '@/lib/defineMetadata';
import { sanityFetch } from '@/sanity/lib/live';
import { pageGeneralQuery, pageGeneralSlugsQuery } from '@/sanity/lib/queries';

import PageGeneral from '../_components/PageGeneral';
import { OwnProfile, ProfileSkeleton, PublicProfile } from './_components/Profile';

export async function generateStaticParams() {
	const { data } = await sanityFetch({
		query: pageGeneralSlugsQuery,
	});

	return data;
}

type Props = {
	params: Promise<{ slug: string }>;
};

// Sanity pages and user profiles share the root; a Sanity slug wins over a username
export async function generateMetadata(props: Props): Promise<Metadata> {
	const params = await props.params;
	const { data } = await sanityFetch({
		query: pageGeneralQuery,
		params,
	});
	if (data) return defineMetadata({ data });

	const username = usernameFromSlug(params.slug);
	const profile = username ? await getUserProfile(username).catch(() => null) : null;
	return { title: profile ? profile.displayName || `@${profile.username}` : undefined };
}

export default async function PageSlugRoute(props: Props) {
	const params = await props.params;

	const { data } = await sanityFetch({
		query: pageGeneralQuery,
		params,
	});

	if (data) {
		return (
			<PageGeneral data={data}>
				{params.slug === 'cookies-policy' && <CookieSettingsButton />}
			</PageGeneral>
		);
	}

	const username = usernameFromSlug(params.slug);
	if (!username) notFound();

	// The session only carries the user id, so compare usernames via the profile
	const me = await getMyProfile();
	if (isOwnUsername(me, username)) {
		return (
			<Suspense fallback={<ProfileSkeleton />}>
				<OwnProfile profile={me} />
			</Suspense>
		);
	}

	// Started now so polls load alongside the profile lookup
	const polls = getUserPolls(username).catch(() => null);
	// Checked before streaming so an unknown slug still answers 404
	const profile = await getUserProfile(username);
	if (!profile) notFound();

	return (
		<Suspense fallback={<ProfileSkeleton />}>
			<PublicProfile profile={profile} polls={polls} isAuthenticated={!!me} />
		</Suspense>
	);
}
