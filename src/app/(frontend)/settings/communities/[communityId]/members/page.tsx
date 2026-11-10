import type { Metadata } from 'next';

import { EmptyCard } from '@/components/EmptyCard';
import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { getMyProfile, redirectToLogin } from '@/data/auth';
import { CommunityMembers } from '@/features/communities/CommunityMembers';
import { communityMembersHref } from '@/features/communities/schema';
import { listMembers, listMyCommunities } from '@/features/communities/service';
import { getServerMessages } from '@/lib/getServerLocale';

import { SettingsSubpageHeader } from '../../../_components/SettingsSubpageHeader';

type Props = { params: Promise<{ communityId: string }> };

export async function generateMetadata(): Promise<Metadata> {
	const { messages } = await getServerMessages();
	return { title: messages.communities.members };
}

export default async function CommunityMembersPage({ params }: Props) {
	const { communityId } = await params;
	const [profile, communities, members] = await Promise.all([
		getMyProfile(),
		listMyCommunities(),
		listMembers(communityId),
	]);
	if (!profile) return redirectToLogin(communityMembersHref(communityId));

	const community = communities.ok ? communities.data.find((o) => o.communityId === communityId) : undefined;
	// Not a member (removed, never was, or the account is gone): 403 `community.not_member`
	const notMember = (communities.ok && !community) || (!members.ok && members.errorCode === 'community.not_member');

	return (
		<PageShell>
			<div className="flex flex-col gap-8">
				<SettingsSubpageHeader title={community ? community.displayName || community.username : <T k="communities.members" />} />
				{community && members.ok ? (
					<CommunityMembers community={community} viewerId={profile.id} members={members.data} />
				) : notMember ? (
					<EmptyCard title={<T k="communities.notMemberTitle" />} body={<T k="communities.notMemberBody" />} />
				) : (
					<EmptyCard title={<T k="common.error" />} body={<T k="common.errorBody" />} />
				)}
			</div>
		</PageShell>
	);
}
