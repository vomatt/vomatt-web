import type { Metadata } from 'next';

import { EmptyCard } from '@/components/EmptyCard';
import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { getMyProfile, redirectToLogin } from '@/data/auth';
import { CommunityInvitationCard } from '@/features/communities/CommunityInvitationCard';
import { communityInvitationHref } from '@/features/communities/schema';
import { getCommunityInvitation } from '@/features/communities/service';
import { handle } from '@/features/profiles/name';
import { getMyProfile as fetchMyProfile } from '@/lib/api/services/users';
import { getServerMessages } from '@/lib/getServerLocale';

type Props = { params: Promise<{ invitationId: string }> };

export async function generateMetadata(): Promise<Metadata> {
	const { messages } = await getServerMessages();
	return { title: messages.communities.invitationPage.title };
}

/** Where the invitation email sends someone, signed in or after signing up. */
export default async function CommunityInvitationPage({ params }: Props) {
	const { invitationId } = await params;
	const [profile, invitation] = await Promise.all([getMyProfile(), getCommunityInvitation(invitationId)]);
	if (!profile) return redirectToLogin(communityInvitationHref(invitationId));

	const unavailable = !invitation.ok && invitation.errorCode === 'community.invitation.not_found';
	if (!invitation.ok && !unavailable) {
		return (
			<PageShell>
				<EmptyCard headingLevel={1} title={<T k="common.error" />} body={<T k="common.errorBody" />} />
			</PageShell>
		);
	}
	// Acting, /users/me answers as the community account; the invitation went to the person
	const person = profile.community
		? await fetchMyProfile(true).catch((error) => {
				// The page still works; it only leaves out which address is signed in
				console.error('Loading the signed-in person for a community invitation failed:', error);
				return null;
			})
		: profile;

	return (
		<PageShell>
			{/* The same element whether or not it is still open: answering refreshes this page, and the card keeps its outcome */}
			<CommunityInvitationCard
				invitationId={invitationId}
				invitation={invitation.ok ? invitation.data : null}
				signedInAs={person && (person.email ?? handle(person.username))}
			/>
		</PageShell>
	);
}
