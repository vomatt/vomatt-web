import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache, Suspense } from 'react';

import { CookieSettingsButton } from '@/components/layout/CookieConsent';
import { getMyProfile } from '@/data/auth';
import { isOwnUsername, usernameFromSlug } from '@/features/account/username';
import { getUserPolls } from '@/features/polls/service';
import { getUserProfile } from '@/lib/api/services/users';
import defineMetadata from '@/lib/defineMetadata';
import { sanityFetch } from '@/sanity/lib/live';
import { getPageSlugs } from '@/sanity/lib/pageSlugs';
import { pageGeneralQuery } from '@/sanity/lib/queries';

import PageGeneral from '../_components/PageGeneral';
import { OwnProfile, ProfileSkeleton, PublicProfile } from './_components/Profile';

export async function generateStaticParams() {
	return (await getPageSlugs()).map((slug) => ({ slug }));
}

// Metadata and the page ask once per request; signed in, the lookup is uncached
const loadProfile = cache(getUserProfile);

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ view?: string; tab?: string; edit?: string }>;
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
	const profile = username ? await loadProfile(username).catch(() => null) : null;
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
	const { view, tab, edit } = await props.searchParams;
	// `?view=public`: the owner sees their page as everyone else does
	if (isOwnUsername(me, username) && view !== 'public') {
		return (
			<Suspense fallback={<ProfileSkeleton />}>
				<OwnProfile profile={me} initialTab={tab === 'voted' ? 'voted' : 'asked'} openEdit={edit === '1'} />
			</Suspense>
		);
	}

	// Started now so polls load alongside the profile lookup
	const polls = getUserPolls(username).catch(() => null);
	// Checked before streaming so an unknown slug still answers 404. Signed in, the
	// profile also says whether the viewer follows or blocked them, so it isn't cached
	const profile = await loadProfile(username);
	if (!profile) notFound();

	return (
		<Suspense fallback={<ProfileSkeleton rail={!isOwnUsername(me, username)} />}>
			<PublicProfile profile={profile} polls={polls} viewerId={me?.id ?? null} preview={isOwnUsername(me, username)} />
		</Suspense>
	);
}
