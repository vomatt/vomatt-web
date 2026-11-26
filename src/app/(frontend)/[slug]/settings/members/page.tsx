import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { SettingsSubpageHeader } from '@/app/(frontend)/settings/_components/SettingsSubpageHeader';
import { EmptyCard } from '@/components/EmptyCard';
import { PageShell } from '@/components/layout/PageShell';
import { rowLinkClassName, RowText, SettingsCard } from '@/components/SettingsCard';
import { T } from '@/components/T';
import { ChevronRight } from '@/components/ui/SvgIcons';
import { getMyCommunities, getMyProfile, getTokenSession, loadActingState, redirectToLogin } from '@/data/auth';
import { isOwnUsername, usernameFromSlug } from '@/features/account/username';
import { CommunityMembers } from '@/features/communities/CommunityMembers';
import { CommunityProfileCard } from '@/features/communities/CommunityProfileCard';
import { DeleteCommunity } from '@/features/communities/DeleteCommunity';
import { canDelete, canManageMembers } from '@/features/communities/permissions';
import { accountName, communityMembersHref } from '@/features/communities/schema';
import { listInvitations, listMembers } from '@/features/communities/service';
import { getUserProfile } from '@/lib/api/services/users';
import { getServerMessages } from '@/lib/getServerLocale';
import { profileHref } from '@/lib/routes';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(): Promise<Metadata> {
	const { messages } = await getServerMessages();
	return { title: messages.communities.members };
}

export default async function CommunityMembersPage({ params }: Props) {
	const username = usernameFromSlug((await params).slug);
	if (!username) notFound();
	const [profile, token, communities, { acting }] = await Promise.all([
		getMyProfile(),
		// The person, not the account they may be acting as: their own row is the one they can leave
		getTokenSession(),
		getMyCommunities(),
		loadActingState(),
	]);
	if (!profile || !token) return redirectToLogin(communityMembersHref(username));

	const community = communities.ok ? communities.data.find((o) => isOwnUsername(o, username)) : undefined;
	if (community && community.username !== username) redirect(communityMembersHref(community.username));
	const [members, invitations, publicProfile] = community
		? await Promise.all([
				listMembers(community.communityId),
				// Only an OWNER or ADMIN can list them; without them the page still works
				canManageMembers(community.role) ? listInvitations(community.communityId) : null,
				getUserProfile(community.username).catch(() => null),
			])
		: [null, null, null];
	// Not a member (removed, never was, or the account is gone): 403 `community.not_member`
	const notMember = (communities.ok && !community) || (members?.ok === false && members.errorCode === 'community.not_member');

	return (
		<PageShell>
			<div className="flex flex-col gap-5 md:gap-8">
				<SettingsSubpageHeader
					title={community ? community.displayName || community.username : <T k="communities.members" />}
					// Acting as this account, Settings is the person's own; the way back is the account's profile
					back={
						community && acting?.communityId === community.communityId
							? { href: profileHref(community.username), to: 'profile', name: accountName(community) }
							: undefined
					}
				/>
				{community && members?.ok ? (
					<div className="flex flex-col gap-8">
						<CommunityProfileCard community={community} bio={publicProfile?.bio ?? null} />
						<CommunityMembers
							community={community}
							viewerId={token.sub}
							members={members.data}
							invitations={invitations?.ok ? invitations.data : undefined}
						/>
						{/* Blocks are the caller's, so only while acting as this account is that page its list */}
						{acting?.communityId === community.communityId && canManageMembers(community.role) && (
							<SettingsCard>
								<Link href="/settings/blocked" className={rowLinkClassName}>
									<RowText title={<T k="blocks.title" />} body={<T k="communities.blockedBody" />} />
									<ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
								</Link>
							</SettingsCard>
						)}
						{canDelete(community.role) && <DeleteCommunity community={community} />}
					</div>
				) : notMember ? (
					<EmptyCard title={<T k="communities.notMemberTitle" />} body={<T k="communities.notMemberBody" />} />
				) : (
					<EmptyCard title={<T k="common.error" />} body={<T k="common.errorBody" />} />
				)}
			</div>
		</PageShell>
	);
}
