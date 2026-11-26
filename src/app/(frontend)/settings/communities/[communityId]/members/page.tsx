import { redirect } from 'next/navigation';

import { EmptyCard } from '@/components/EmptyCard';
import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { getMyCommunities } from '@/data/auth';
import { communityMembersHref } from '@/features/communities/schema';

import { SettingsSubpageHeader } from '../../../_components/SettingsSubpageHeader';

type Props = { params: Promise<{ communityId: string }> };

// The members page moved under the account's profile; links saved before then still land there
export default async function OldCommunityMembersPage({ params }: Props) {
	const { communityId } = await params;
	const communities = await getMyCommunities();
	// Saying they're not a member would be wrong here; the error page can try again
	if (!communities.ok) throw new Error(`Could not load community accounts: ${communities.errorCode}`);
	const community = communities.data.find((o) => o.communityId === communityId);
	if (community) redirect(communityMembersHref(community.username));

	// Removed, never was, or the account is gone: the same answer the members page gives
	return (
		<PageShell>
			<div className="flex flex-col gap-5 md:gap-8">
				<SettingsSubpageHeader title={<T k="communities.members" />} />
				<EmptyCard title={<T k="communities.notMemberTitle" />} body={<T k="communities.notMemberBody" />} />
			</div>
		</PageShell>
	);
}
