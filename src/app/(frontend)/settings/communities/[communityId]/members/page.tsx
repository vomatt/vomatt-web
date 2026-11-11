import type { Metadata } from 'next';

import { EmptyCard } from '@/components/EmptyCard';
import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { getMyCommunities, getMyProfile, getTokenSession, redirectToLogin } from '@/data/auth';
import { CommunityMembers } from '@/features/communities/CommunityMembers';
import { CommunityProfileCard } from '@/features/communities/CommunityProfileCard';
import { DeleteCommunity } from '@/features/communities/DeleteCommunity';
import { canDelete, canManageMembers } from '@/features/communities/permissions';
import { communityMembersHref } from '@/features/communities/schema';
import { listInvitations, listMembers } from '@/features/communities/service';
import { getUserProfile } from '@/lib/api/services/users';
import { getServerMessages } from '@/lib/getServerLocale';

import { SettingsSubpageHeader } from '../../../_components/SettingsSubpageHeader';

type Props = { params: Promise<{ communityId: string }> };

export async function generateMetadata(): Promise<Metadata> {
	const { messages } = await getServerMessages();
	return { title: messages.communities.members };
}

export default async function CommunityMembersPage({ params }: Props) {
	const { communityId } = await params;
	const [profile, token, communities, members] = await Promise.all([
		getMyProfile(),
		// The person, not the account they may be acting as: their own row is the one they can leave
		getTokenSession(),
		getMyCommunities(),
		listMembers(communityId),
	]);
	if (!profile || !token) return redirectToLogin(communityMembersHref(communityId));

	const community = communities.ok ? communities.data.find((o) => o.communityId === communityId) : undefined;
	// Not a member (removed, never was, or the account is gone): 403 `community.not_member`
	const notMember = (communities.ok && !community) || (!members.ok && members.errorCode === 'community.not_member');
	// Only an OWNER or ADMIN can list them; without them the page still works
	const [invitations, publicProfile] = await Promise.all([
		community && canManageMembers(community.role) ? listInvitations(communityId) : null,
		community ? getUserProfile(community.username).catch(() => null) : null,
	]);

	return (
		<PageShell>
			<div className="flex flex-col gap-8">
				<SettingsSubpageHeader title={community ? community.displayName || community.username : <T k="communities.members" />} />
				{community && members.ok ? (
					<>
						<CommunityProfileCard community={community} bio={publicProfile?.bio ?? null} />
						<CommunityMembers
							community={community}
							viewerId={token.sub}
							members={members.data}
							invitations={invitations?.ok ? invitations.data : []}
						/>
						{canDelete(community.role) && <DeleteCommunity community={community} />}
					</>
				) : notMember ? (
					<EmptyCard title={<T k="communities.notMemberTitle" />} body={<T k="communities.notMemberBody" />} />
				) : (
					<EmptyCard title={<T k="common.error" />} body={<T k="common.errorBody" />} />
				)}
			</div>
		</PageShell>
	);
}
