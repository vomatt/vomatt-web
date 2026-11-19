import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { cache, Suspense } from 'react';

import { JsonLd } from '@/components/JsonLd';
import { Refreshable } from '@/components/Refreshable';
import { getMyProfile } from '@/data/auth';
import { isOwnUsername, usernameFromSlug } from '@/features/account/username';
import { getUserPolls } from '@/features/polls/service';
import { getUserProfile } from '@/lib/api/services/users';
import { getServerMessages } from '@/lib/getServerLocale';
import { interpolate } from '@/lib/interpolate';
import { pageOpenGraph } from '@/lib/pageOpenGraph';
import { profileHref } from '@/lib/routes';
import { profileJsonLd, profileTitle } from '@/lib/structuredData';

import { OwnProfile, ProfileSkeleton, PublicProfile } from './_components/Profile';

// Metadata and the page ask once per request; signed in, the lookup is uncached
const loadProfile = cache(getUserProfile);

// Coming back within 3 minutes shows this page from the browser's cache instead of rendering it and
// calling the API again. Actions that revalidate drop it; pulling down refetches (`Refreshable`)
export const unstable_dynamicStaleTime = 180;

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ view?: string; tab?: string; edit?: string }>;
};

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
	const params = await props.params;
	const username = usernameFromSlug(params.slug);
	const [profile, { messages }] = await Promise.all([
		username ? loadProfile(username).catch(() => null) : null,
		getServerMessages(),
	]);
	if (!profile) return { title: messages.common.notFoundTitle };
	const name = profileTitle(profile);
	return {
		title: name,
		description: profile.bio || interpolate(messages.meta.profileDescription, { name }),
		alternates: { canonical: profileHref(profile.username) },
		openGraph: await pageOpenGraph(parent, { url: profileHref(profile.username), type: 'profile', username: profile.username }),
	};
}

export default async function PageSlugRoute(props: Props) {
	const params = await props.params;
	const username = usernameFromSlug(params.slug);
	if (!username) notFound();

	// The session only carries the user id, so compare usernames via the profile
	const me = await getMyProfile();
	const { view, tab, edit } = await props.searchParams;
	// `?view=public`: the owner sees their page as everyone else does
	if (isOwnUsername(me, username) && view !== 'public') {
		return (
			<Refreshable>
				<Suspense fallback={<ProfileSkeleton />}>
					<OwnProfile profile={me} initialTab={tab === 'voted' || tab === 'saved' ? tab : 'asked'} openEdit={edit === '1'} />
				</Suspense>
			</Refreshable>
		);
	}

	// Started now so polls load alongside the profile lookup
	const polls = getUserPolls(username).catch(() => null);
	// Checked before the page streams, so an unknown slug gets the not-found page (the layout's
	// Suspense has already sent a 200 by then; Next adds noindex). Signed in, the
	// profile also says whether the viewer follows or blocked them, so it isn't cached
	const profile = await loadProfile(username);
	if (!profile) notFound();

	return (
		<>
			<JsonLd data={profileJsonLd(profile)} />
			<Refreshable>
				<Suspense fallback={<ProfileSkeleton rail={!isOwnUsername(me, username)} />}>
					<PublicProfile profile={profile} polls={polls} viewerId={me?.id ?? null} preview={isOwnUsername(me, username)} />
				</Suspense>
			</Refreshable>
		</>
	);
}
